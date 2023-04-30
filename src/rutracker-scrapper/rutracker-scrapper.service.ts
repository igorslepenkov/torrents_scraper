import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose';
import puppeteer, {
  ElementHandle,
  Page,
  PuppeteerLaunchOptions,
} from 'puppeteer';

import { Cluster } from 'puppeteer-cluster';

import { Section } from 'src/sections';
import { Subsection } from 'src/subsections';
import { ITorrent } from 'src/types';

@Injectable()
export class RutrackerScrapperService {
  MAX_BROWSERS = this.configService.get<number>('maxBrowsersCount');
  MAX_TIMEOUT = 3000;
  BROWSER_CONFIG: PuppeteerLaunchOptions = {
    headless: true,
    args: [
      "--proxy-server='direct://'",
      '--proxy-bypass-list=*',
      '--disable-extensions',
      '--disable-gpu',
      '--no-sandbox',
    ],
  };
  RUTRACKER_URL: string = this.configService.get<string>('rutrackerUrl');

  constructor(
    @InjectModel(Section.name) private sectionModel: Model<Section>,
    @InjectModel(Subsection.name) private subsectionModel: Model<Subsection>,
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

  private async navigateRutrackerPage(page: Page, link: string): Promise<void> {
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36',
    );
    await page.goto(link, { timeout: 0 });
    await this.submitAuthenticationForm(page);
    await page.waitForNetworkIdle({
      idleTime: 1000,
      timeout: this.MAX_TIMEOUT,
    });
  }

  private async getAllTorrentLinksFromPage(page: Page): Promise<string[]> {
    return await page.$$eval('a.med.tLink', (linkElements) =>
      linkElements.map((element) => element.href),
    );
  }

  private async getTorrentsLinks(linkToSubsectionPage: string, max: number) {
    const browser = await puppeteer.launch(this.BROWSER_CONFIG);
    const page = await browser.newPage();
    await this.navigateRutrackerPage(page, linkToSubsectionPage);

    let nextButtonHandler = await page.$(
      'xpath/' + '//a[@class="pg"][contains(., "След.")]',
    );
    let nextButtonElementHref = await nextButtonHandler.evaluate(
      (btn) => (btn as HTMLAnchorElement).href,
    );
    let torrentLinks: string[] = await this.getAllTorrentLinksFromPage(page);

    while (nextButtonElementHref && torrentLinks.length < max) {
      await page.goto(nextButtonElementHref);
      const torrentsLinksOnPage = await this.getAllTorrentLinksFromPage(page);
      torrentLinks = [...torrentLinks, ...torrentsLinksOnPage];

      nextButtonHandler = await page.$(
        'xpath/' + '//a[@class="pg"][contains(., "След.")]',
      );
      nextButtonElementHref = await nextButtonHandler.evaluate(
        (btn) => (btn as HTMLAnchorElement).href,
      );
    }

    return torrentLinks.length > max
      ? torrentLinks.slice(0, max)
      : torrentLinks;
  }

  private async getTorrentInfoFromLink(
    page: Page,
    { link }: { link: string },
  ): Promise<ITorrent> {
    await this.navigateRutrackerPage(page, link);

    const titleSelector = 'a#topic-title';
    let title = '';
    try {
      const titleHandler = await page.waitForSelector(titleSelector, {
        timeout: this.MAX_TIMEOUT,
      });
      title = await titleHandler.evaluate((title) => title.textContent);
    } catch (err) {
      title = 'Title not found';
    }

    const descriptionXPath =
      '//tbody[@class="row1"]//div[@class="post_body"]//span[contains(., "Описание")]/following-sibling::text()[1]';
    let description = '';
    try {
      const descriptionHandler = await page.waitForXPath(descriptionXPath, {
        timeout: this.MAX_TIMEOUT,
      });
      description = (
        await descriptionHandler.evaluate((node) => node.textContent)
      ).replace(/^:\s/, '');
    } catch (err) {
      description = 'Description not found';
    }

    const releaseDateXPath =
      '//table[@class="attach bordered med"]/tbody/tr[@class="row1"]/td[contains(., "Зарегистрирован")]/following-sibling::td/ul/li[1]';
    let releaseDate = '';
    try {
      const releaseDateHandler = await page.waitForXPath(releaseDateXPath, {
        timeout: this.MAX_TIMEOUT,
      });
      releaseDate = await releaseDateHandler.evaluate(
        (element) => element.textContent,
      );
    } catch (err) {
      releaseDate = 'Release date not found';
    }

    const authorsNicknameSelector = 'p.nick.nick-author';
    let authorsNickname = '';
    try {
      const authorsNicknameHandler = await page.waitForSelector(
        authorsNicknameSelector,
        { timeout: this.MAX_TIMEOUT },
      );
      authorsNickname = await authorsNicknameHandler.evaluate(
        (element) => element.textContent,
      );
    } catch (err) {
      authorsNickname = 'Гость';
    }

    const magneteLinkSelector = 'a.med.magnet-link';
    let magneteLink = '';
    try {
      const magneteLinkHandler = await page.waitForSelector(
        magneteLinkSelector,
        {
          timeout: this.MAX_TIMEOUT,
        },
      );
      magneteLink = await magneteLinkHandler.evaluate(
        (element) => element.href,
      );
    } catch (err) {
      magneteLink = 'Magnete link not found';
    }

    const downloadLinkSelector = 'a.dl-stub.dl-link.dl-topic';
    let downloadLink = '';
    try {
      const downloadLinkHandler = await page.waitForSelector(
        downloadLinkSelector,
        {
          timeout: this.MAX_TIMEOUT,
        },
      );
      downloadLink = await downloadLinkHandler.evaluate(
        (element) => element.href,
      );
    } catch (err) {
      downloadLink = 'Download link not found';
    }

    const gratefulPeopleXPath =
      '//span[contains(., "Последние поблагодарившие")]/..';
    let gratefulPeopleList: { nickname: string; date: string }[] = [];
    try {
      const gratefulPeopleWrapperHandler = await page.waitForXPath(
        gratefulPeopleXPath,
        {
          timeout: this.MAX_TIMEOUT,
        },
      );

      (gratefulPeopleWrapperHandler as ElementHandle<HTMLSpanElement>).click();

      await page.waitForSelector('div#thx-list a b i', {
        timeout: this.MAX_TIMEOUT,
      });

      const gratefulPeopleListHandlers = await page.$$(
        'xpath/' + '//div[@id="thx-list"]/a/b',
      );

      const gratefulPeopleResultsList = await Promise.allSettled(
        gratefulPeopleListHandlers.map(async (handler) => {
          const nicknameHandler = await handler.$('xpath/' + 'text()');
          const nickname = await nicknameHandler.evaluate(
            (node) => node.textContent,
          );

          const dateHandler = await handler.$('xpath/' + 'i');
          const date = await dateHandler.evaluate((element) =>
            element.textContent.replace(/^\(|\)$/g, ''),
          );
          return { nickname, date };
        }),
      );

      gratefulPeopleResultsList.forEach((result) =>
        result.status === 'fulfilled'
          ? gratefulPeopleList.push(result.value)
          : false,
      );
    } catch (err) {}

    await page.close();

    return {
      title,
      description,
      releaseDate,
      authorsNickname,
      magneteLink,
      downloadLink,
      gratefulPeopleList,
    };
  }

  public async getRutrackerSectionsTree(): Promise<
    Document<unknown, {}, Section>[]
  > {
    try {
      await this.sectionModel.deleteMany();
      await this.subsectionModel.deleteMany();
      const browser = await puppeteer.launch(this.BROWSER_CONFIG);

      const page = await browser.newPage();
      await this.navigateRutrackerPage(page, this.RUTRACKER_URL);

      await page.waitForSelector('select#fs-main');

      const sections = await page.$$('select#fs-main > optgroup');
      const tree = await Promise.all(
        sections.map((sectionHandler) =>
          this.getSectionFromElementHandler(sectionHandler, this.RUTRACKER_URL),
        ),
      );

      await this.putTreeInDatabase(tree);

      return await this.sectionModel.find();
    } catch (err) {
      console.log(err);

      throw new HttpException('Error during getting sections tree', 500);
    }
  }

  public async getSubsectionsTorrents(subsectionId: string, max: number) {
    try {
      const subsection = await this.subsectionModel.findById(subsectionId);

      if (!subsection) throw new NotFoundException();

      const torrentsLinks = await this.getTorrentsLinks(subsection.link, max);

      const cluster = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_BROWSER,
        maxConcurrency: this.MAX_BROWSERS,
        puppeteerOptions: this.BROWSER_CONFIG,
        retryLimit: 1,
      });

      cluster.on('taskerror', (err, data, willRetry) => {
        if (willRetry) {
          console.warn(
            `Encountered an error while crawling ${data}. ${err.message}\nThis job will be retried`,
          );
        } else {
          console.error(`Failed to crawl ${data}: ${err.message}`);
        }
      });

      await cluster.task(async ({ page, data: link }) => {
        return this.getTorrentInfoFromLink(page, { link });
      });

      for (const link of torrentsLinks) {
        cluster.queue(link);
      }

      const result = await Promise.allSettled<ITorrent>(
        torrentsLinks.map(async (link) => await cluster.execute(link)),
      );
      await cluster.idle();
      await cluster.close();

      const filteredResults = result.filter(
        (promiseResult) => promiseResult.status === 'fulfilled',
      );

      return { result: filteredResults, count: filteredResults.length };
    } catch (err) {
      console.log(err);
      if (err.status === 404) {
        throw new NotFoundException('Subsection not found');
      }

      throw new HttpException('Error during getting torrents', 500);
    }
  }
}
