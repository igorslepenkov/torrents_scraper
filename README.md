<div id="top"></div>

<br />
<div align="center">
  <h2 align="center">Rutracker scrapper</h3>

  <p align="center">Simple pet web scrapper for rutracker torrents</p>
</div>

## Installation:

1. Rename .env.example to .env
2. Set environment variables as you need :

```
    - SERVER_PORT=port on your machine, where you app will be running
    - RUTRACKER_USER=your rutracker username
    - RUTRACKER_PASSWORD=your rutracker password
    - MAX_BROWSERS=max amount of browsers working in parallel, consider choosing this option in accordance with your machine's capabilities
```

3. Run docker compose (install Docker if you don't have it already in your system or install Podman + podman-compose script if you don't have stable docker for your OS (like Fedora 38 at the moment of writing of this instructions))

```
  docker compose up
```

or

```
 podman-compose up
```

4. Available endpoints:

```
  GET /scrapper/get_tree - Gets current rutracker tree of the sections and subsection

  GET /sections - Gets all sections (id, name and list of subsections ids)

  GET /subsections - Gets all subsections (id, name, section, rutracker link)
  GET /subsections/:subsection_id/torrents?max=50 - Gets info of subsection's torrents (title, description, release date, download link, magnete link and grateful people list) default value for max is 50 - you will get 50 first torrents of the subsection
```
