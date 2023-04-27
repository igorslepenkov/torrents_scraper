import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose';
import puppeteer, { ElementHandle, Page } from 'puppeteer';

import { Section } from 'src/sections';
import { Subsection } from 'src/subsections';
import { Torrent } from 'src/torrents';

@Injectable()
export class RutrackerScrapperService {
  constructor(
    @InjectModel(Section.name) private sectionModel: Model<Section>,
    @InjectModel(Subsection.name) private subsectionModel: Model<Subsection>,
    @InjectModel(Torrent.name) private torrentModel: Model<Torrent>,
    private readonly configService: ConfigService,
  ) {}

  private async getSubsectionsFromSubsectionsHandlers(
    subsectionsHandlers: ElementHandle<HTMLOptionElement>[],
    url: string,
  ): Promise<Partial<Subsection>[]> {
    return await Promise.all(
      subsectionsHandlers.map(async (subsectionHandler) => {
        return await subsectionHandler.evaluate(
          async (subsectionElement, { url }) => {
            const name = subsectionElement.textContent;
            const link = url + `?f=${subsectionElement.value}`;

            return {
              name,
              link,
            };
          },
          { url },
        );
      }),
    );
  }

  private async getSectionFromElementHandler(
    sectionHandler: ElementHandle<HTMLOptGroupElement>,
    url: string,
  ): Promise<{ name: string; subsections: Partial<Subsection>[] }> {
    const sectionName = await sectionHandler.evaluate(
      (sectionElement) => sectionElement.label,
    );
    const subsectionsHandlers = await sectionHandler.$$('option');
    const subsections = await this.getSubsectionsFromSubsectionsHandlers(
      subsectionsHandlers,
      url,
    );

    return {
      name: sectionName,
      subsections,
    };
  }

  private async putTreeInDatabase(
    sectionTree: { name: string; subsections: Partial<Subsection>[] }[],
  ) {
    return Promise.all(
      sectionTree.map(async ({ name, subsections }) => {
        const sectionObject = await this.sectionModel.create({ name });

        const subsectionsObjects = await Promise.all(
          subsections.map(async ({ name, link }) => {
            return await this.subsectionModel.create({
              name,
              link,
              section: sectionObject,
            });
          }),
        );

        sectionObject.subsections = subsectionsObjects;
        await sectionObject.save();

        return sectionObject;
      }),
    );
  }

  private async submitAuthenticationForm(page: Page): Promise<boolean> {
    const username = this.configService.get<string>('rutrackerUser');
    const password = this.configService.get<string>('rutrackerPassword');

    await page.$eval(
      'input[name="login_username"]',
      (usernameInput, { username }) => {
        usernameInput.value = username;
      },
      { username },
    );

    await page.$eval(
      'input[name="login_password"]',
      (passwordInput, { password }) => {
        passwordInput.value = password;
      },
      { password },
    );

    await page.$eval('input[name="login"]', (submit) => {
      submit.click();
    });

    return true;
  }

  public async getRutrackerSectionsTree(): Promise<
    Document<unknown, {}, Section>[]
  > {
    await this.sectionModel.deleteMany();
    await this.subsectionModel.deleteMany();

    const url = this.configService.get<string>('RUTRACKER_URL');
    const browserConfig = {
      headless: true,
      args: [
        "--proxy-server='direct://'",
        '--proxy-bypass-list=*',
        '--disable-extensions',
        '--disable-gpu',
      ],
    };

    const browser = await puppeteer.launch(browserConfig);

    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36',
    );
    await page.goto(url, { timeout: 0 });

    await this.submitAuthenticationForm(page);

    await page.waitForSelector('select#fs-main', { timeout: 0 });
    await page.waitForTimeout(3000);

    const sections = await page.$$('select#fs-main > optgroup');
    const tree = await Promise.all(
      sections.map((sectionHandler) =>
        this.getSectionFromElementHandler(sectionHandler, url),
      ),
    );

    await this.putTreeInDatabase(tree);

    return await this.sectionModel.find();
  }
}
