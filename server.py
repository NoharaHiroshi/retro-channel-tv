#!/usr/bin/env python3
import json
import re
import socket
import sqlite3
import sys
from concurrent.futures import ThreadPoolExecutor, wait
from html import unescape
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, urlencode, urlparse
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parent
DB_PATH = ROOT / "retro_tv.sqlite3"
PORT = 8017
TIMEOUT = 8
SEARCH_DEADLINE = 6

INVIDIOUS_ENDPOINTS = [
    "https://yewtu.be/api/v1/search",
    "https://inv.nadeko.net/api/v1/search",
    "https://vid.puffyan.us/api/v1/search",
    "https://invidious.privacydev.net/api/v1/search",
]

PIPED_ENDPOINTS = [
    "https://pipedapi.kavin.rocks/search",
    "https://pipedapi.adminforge.de/search",
]

DEFAULT_CHANNELS = [
    {
        "id": "arcade",
        "order": 1,
        "name": "深夜街机台",
        "description": "街机长玩、合成器、霓虹城市与夜间信号。",
        "tags": ["游戏", "街机", "合成器", "复古"],
        "scoutTerms": ["复古街机 gameplay", "synthwave night drive", "80s computer demo"],
        "programs": [
            {"id": "yt-arcade", "title": "街机长玩", "source": "youtube", "videoId": "Dk3mCZqB3jU", "duration": 900, "tags": ["游戏", "街机", "复古"]},
            {"id": "yt-synth", "title": "夜车合成器", "source": "youtube", "videoId": "MV_3Dpw-BRY", "duration": 1200, "tags": ["音乐", "合成器", "城市"]},
            {"id": "yt-computer-history", "title": "电脑历史档案", "source": "youtube", "videoId": "mCq8-xTH7jA", "duration": 540, "tags": ["电脑", "档案", "教育", "复古"]},
        ],
    },
    {
        "id": "lab",
        "order": 2,
        "name": "公共实验室",
        "description": "旧科学片、太空档案、电脑历史与公共频道气质。",
        "tags": ["科学", "档案", "教育", "太空"],
        "scoutTerms": ["public domain science film", "NASA archive", "vintage computer documentary"],
        "programs": [
            {"id": "yt-nasa", "title": "NASA 地球窗口", "source": "youtube", "videoId": "86YLFOog4GM", "duration": 1200, "tags": ["太空", "科学", "档案", "氛围"]},
            {"id": "yt-computer-history", "title": "电脑历史档案", "source": "youtube", "videoId": "mCq8-xTH7jA", "duration": 540, "tags": ["电脑", "档案", "教育", "复古"]},
        ],
    },
    {
        "id": "music",
        "order": 3,
        "name": "午夜音乐台",
        "description": "低保真、爵士现场和适合当背景的长段音乐。",
        "tags": ["音乐", "低保真", "爵士", "氛围"],
        "scoutTerms": ["lofi live set", "jazz performance archive", "ambient music video"],
        "programs": [
            {"id": "yt-lofi", "title": "低保真窗边", "source": "youtube", "videoId": "jfKfPfyJRdk", "duration": 1200, "tags": ["音乐", "低保真", "氛围"]},
            {"id": "yt-jazz", "title": "爵士房间", "source": "youtube", "videoId": "Dx5qFachd3A", "duration": 1200, "tags": ["音乐", "爵士", "现场"]},
        ],
    },
    {
        "id": "cinema",
        "order": 4,
        "name": "小型影院",
        "description": "短片、动画与公共领域电影轮播。",
        "tags": ["电影", "动画", "短片"],
        "scoutTerms": ["short animation film", "public domain short film", "classic cartoon"],
        "programs": [
            {"id": "yt-big-buck-bunny", "title": "大兔子邦尼", "source": "youtube", "videoId": "aqz-KE-bpKQ", "duration": 596, "tags": ["动画", "短片", "电影"]},
            {"id": "yt-sintel", "title": "辛特尔", "source": "youtube", "videoId": "eRsGyueVLvQ", "duration": 888, "tags": ["动画", "短片", "电影"]},
        ],
    },
    {
        "id": "travel",
        "order": 5,
        "name": "梦游旅行台",
        "description": "列车前窗、城市漫步、雨夜街景和慢速移动。",
        "tags": ["旅行", "城市", "列车", "步行"],
        "scoutTerms": ["city walk night", "train cab view", "street food walk"],
        "programs": [
            {"id": "yt-train", "title": "列车前窗", "source": "youtube", "videoId": "3rDjPLvOShM", "duration": 1200, "tags": ["旅行", "列车", "氛围"]},
            {"id": "yt-city-walk", "title": "夜色城市漫游", "source": "youtube", "videoId": "Fhg8tvyJbAo", "duration": 1200, "tags": ["旅行", "城市", "步行"]},
        ],
    },
]


class RetroTVHandler(SimpleHTTPRequestHandler):
    server_version = "RetroTV/1.0"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/health":
            self.send_json({"ok": True})
            return
        if parsed.path == "/api/channels":
            self.send_json({"ok": True, "channels": get_channels()})
            return
        if parsed.path == "/api/search":
            self.handle_search(parsed)
            return
        if parsed.path == "/api/bilibili/import":
            self.handle_bilibili_import(parsed)
            return
        if parsed.path == "/api/bilibili/player":
            self.handle_bilibili_player(parsed)
            return
        super().do_GET()

    def do_PUT(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/channels":
            payload = self.read_json_body()
            channels = payload.get("channels") if isinstance(payload, dict) else None
            if not isinstance(channels, list) or not channels:
                self.send_json({"ok": False, "error": "channels must be a non-empty list"}, HTTPStatus.BAD_REQUEST)
                return
            save_channels(channels)
            self.send_json({"ok": True, "channels": get_channels()})
            return
        self.send_error(HTTPStatus.NOT_FOUND)

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/reset":
            save_channels(DEFAULT_CHANNELS)
            self.send_json({"ok": True, "channels": get_channels()})
            return
        self.send_error(HTTPStatus.NOT_FOUND)

    def do_DELETE(self):
        parsed = urlparse(self.path)
        match = re.fullmatch(r"/api/channels/([^/]+)", parsed.path)
        if match:
            channel_id = match.group(1)
            channels = [channel for channel in get_channels() if channel.get("id") != channel_id]
            if not channels:
                self.send_json({"ok": False, "error": "cannot delete the last channel"}, HTTPStatus.BAD_REQUEST)
                return
            save_channels(channels)
            self.send_json({"ok": True, "channels": get_channels()})
            return
        self.send_error(HTTPStatus.NOT_FOUND)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(HTTPStatus.NO_CONTENT)
        self.end_headers()

    def read_json_body(self):
        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0:
            return {}
        raw = self.rfile.read(length).decode("utf-8")
        return json.loads(raw)

    def handle_search(self, parsed):
        query = parse_qs(parsed.query).get("q", [""])[0].strip()
        if not query:
            self.send_json({"ok": False, "error": "missing query", "programs": []}, HTTPStatus.BAD_REQUEST)
            return

        programs, errors = run_searchers(query)

        self.send_json({
            "ok": bool(programs),
            "query": query,
            "programs": dedupe(programs)[:16],
            "errors": errors,
        })

    def handle_bilibili_player(self, parsed):
        params = {k: v[0] for k, v in parse_qs(parsed.query).items()}
        upstream = f"https://player.bilibili.com/player.html?{urlencode(params)}"
        try:
            req = Request(upstream, headers={
                "User-Agent": (
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"
                ),
                "Accept": "text/html,application/xhtml+xml,*/*",
                "Accept-Language": "zh-CN,zh;q=0.9",
                "Referer": "https://www.bilibili.com/",
            })
            with urlopen(req, timeout=TIMEOUT) as resp:
                charset = resp.headers.get_content_charset() or "utf-8"
                html = resp.read().decode(charset, errors="replace")
        except Exception:
            self.send_response(HTTPStatus.FOUND)
            self.send_header("Location", upstream)
            self.end_headers()
            return

        inject = (
            '<script>(function(){'
            'var done=false;'
            'document.addEventListener("mouseenter",function(){done=true;},{once:true,capture:true});'
            'function h(){'
            'if(done)return;'
            'var c=document.querySelector(".bpx-player-container");'
            'if(c)c.setAttribute("data-ctrl-hidden","true");'
            '}'
            '[0,150,400,800,1400,2200,3500].forEach(function(d){setTimeout(h,d);});'
            '}());</script>'
        )
        html = html.replace("</head>", inject + "</head>", 1) if "</head>" in html else inject + html

        body = html.encode("utf-8")
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def handle_bilibili_import(self, parsed):
        source_url = parse_qs(parsed.query).get("url", [""])[0].strip()
        if not source_url:
            self.send_json({"ok": False, "error": "missing url", "programs": []}, HTTPStatus.BAD_REQUEST)
            return
        try:
            result = import_bilibili_programs(source_url)
        except ValueError as exc:
            self.send_json({"ok": False, "error": str(exc), "programs": []}, HTTPStatus.BAD_REQUEST)
            return
        except (HTTPError, URLError, socket.timeout, TimeoutError, ValueError) as exc:
            self.send_json({"ok": False, "error": f"import failed: {exc}", "programs": []}, HTTPStatus.BAD_GATEWAY)
            return
        self.send_json({"ok": bool(result["programs"]), **result})

    def send_json(self, payload, status=HTTPStatus.OK):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def search_youtube(query):
    programs = []
    params = {"q": query, "type": "video", "sort_by": "relevance"}

    for endpoint in INVIDIOUS_ENDPOINTS:
        try:
            data = fetch_json(f"{endpoint}?{urlencode(params)}")
            for item in data:
                if item.get("type") == "video" and item.get("videoId"):
                    programs.append({
                        "id": f"yt-{item['videoId']}",
                        "title": clean_text(item.get("title") or "YouTube 视频"),
                        "source": "youtube",
                        "videoId": item["videoId"],
                        "duration": clamp_int(item.get("lengthSeconds"), 45, 1200, 300),
                        "skipStart": 0,
                        "skipEnd": 0,
                        "tags": tokenize(f"{query} {item.get('title', '')}"),
                    })
            if programs:
                return programs[:8]
        except (HTTPError, URLError, socket.timeout, TimeoutError, ValueError):
            continue

    for endpoint in PIPED_ENDPOINTS:
        try:
            data = fetch_json(f"{endpoint}?{urlencode({'q': query, 'filter': 'videos'})}")
            items = data.get("items", data if isinstance(data, list) else [])
            for item in items:
                url = item.get("url") or ""
                video_id = extract_youtube_id(url)
                if video_id:
                    programs.append({
                        "id": f"yt-{video_id}",
                        "title": clean_text(item.get("title") or "YouTube 视频"),
                        "source": "youtube",
                        "videoId": video_id,
                        "duration": clamp_int(parse_duration(item.get("duration")), 45, 1200, 300),
                        "skipStart": 0,
                        "skipEnd": 0,
                        "tags": tokenize(f"{query} {item.get('title', '')}"),
                    })
            if programs:
                return programs[:8]
        except (HTTPError, URLError, socket.timeout, TimeoutError, ValueError):
            continue

    return programs


def import_bilibili_programs(source_url):
    if "bilibili.com" not in source_url and "b23.tv" not in source_url:
        raise ValueError("不是 B站链接")
    source_url = resolve_bilibili_url(source_url)

    season_match = re.search(r"/ss(\d+)", source_url)
    episode_match = re.search(r"/ep(\d+)", source_url)
    if season_match or episode_match:
        key = "season_id" if season_match else "ep_id"
        value = season_match.group(1) if season_match else episode_match.group(1)
        return import_bangumi(key, value)

    media_match = re.search(r"/md(\d+)", source_url)
    if media_match:
        return import_bangumi_media(media_match.group(1))

    space_match = re.search(r"space\.bilibili\.com/(\d+).*?/lists/(\d+)", source_url)
    if space_match:
        return import_space_series(space_match.group(1), space_match.group(2))

    bvid_match = re.search(r"(BV[a-zA-Z0-9]{10})", source_url)
    if bvid_match:
        return import_bvid_pages(bvid_match.group(1))

    aid_match = re.search(r"/video/av(\d+)", source_url)
    if aid_match:
        return import_bvid_pages("", aid_match.group(1))

    raise ValueError("暂不支持这个 B站链接，请使用番剧 ss/ep、多 P 视频 BV、或空间合集 lists 链接")


def resolve_bilibili_url(source_url):
    if "b23.tv" not in source_url:
        return source_url
    req = Request(source_url, headers={
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"
        )
    })
    with urlopen(req, timeout=TIMEOUT) as response:
        return response.geturl()


def import_bangumi(key, value):
    payload = fetch_json(f"https://api.bilibili.com/pgc/view/web/season?{urlencode({key: value})}", headers=bili_headers())
    result = payload.get("result") or {}
    season_title = clean_text(result.get("title") or "B站番剧")
    episodes = result.get("episodes") or []
    programs = []
    for index, episode in enumerate(episodes, start=1):
        bvid = episode.get("bvid")
        cid = episode.get("cid")
        if not bvid:
            continue
        label = clean_text(episode.get("title") or f"{index}")
        long_title = clean_text(episode.get("long_title") or "")
        title = f"{season_title} · 第 {label} 集"
        if long_title:
            title = f"{title} {long_title}"
        programs.append({
            "id": f"bili-ep-{episode.get('id') or bvid}-{cid or index}",
            "title": title,
            "source": "bilibili",
            "bvid": bvid,
            "cid": str(cid or ""),
            "page": index,
            "duration": normalize_bili_duration(episode.get("duration"), 1440),
            "skipStart": 0,
            "skipEnd": 0,
            "tags": ["B站", "番剧", season_title],
        })
    return {"title": season_title, "kind": "bangumi", "programs": programs}


def import_bangumi_media(media_id):
    payload = fetch_json(
        f"https://api.bilibili.com/pgc/review/user?{urlencode({'media_id': media_id})}",
        headers=bili_headers(),
    )
    result = payload.get("result") or {}
    media = result.get("media") or {}
    season_id = result.get("season_id") or media.get("season_id")
    if not season_id:
        raise ValueError("未能从 media/md 链接解析到 season_id")
    return import_bangumi("season_id", str(season_id))


def import_bvid_pages(bvid, aid=""):
    params = {"bvid": bvid} if bvid else {"aid": aid}
    payload = fetch_json(f"https://api.bilibili.com/x/web-interface/view?{urlencode(params)}", headers=bili_headers())
    data = payload.get("data") or {}
    title = clean_text(data.get("title") or "B站视频")
    owner = clean_text((data.get("owner") or {}).get("name") or "")
    pages = data.get("pages") or []
    if not pages and data.get("bvid"):
        pages = [{"page": 1, "part": title, "duration": data.get("duration"), "cid": data.get("cid")}]

    programs = []
    for page in pages:
        page_number = int(page.get("page") or len(programs) + 1)
        part = clean_text(page.get("part") or f"第 {page_number} P")
        programs.append({
            "id": f"bili-{data.get('bvid') or bvid}-p{page_number}",
            "title": f"{title} · {part}" if len(pages) > 1 else title,
            "source": "bilibili",
            "bvid": data.get("bvid") or bvid,
            "cid": str(page.get("cid") or ""),
            "page": page_number,
            "duration": clamp_int(page.get("duration") or data.get("duration"), 45, 86400, 1200),
            "skipStart": 0,
            "skipEnd": 0,
            "tags": ["B站", "多P视频", owner],
        })
    return {"title": title, "kind": "video_pages", "programs": programs}


def import_space_series(mid, season_id):
    programs = []
    title = "B站合集"
    for page_num in range(1, 6):
        params = {"mid": mid, "season_id": season_id, "page_num": page_num, "page_size": 100}
        payload = fetch_json(
            f"https://api.bilibili.com/x/polymer/web-space/seasons_archives_list?{urlencode(params)}",
            headers=bili_headers(),
        )
        data = payload.get("data") or {}
        meta = data.get("meta") or {}
        title = clean_text(meta.get("name") or title)
        archives = data.get("archives") or []
        for archive in archives:
            bvid = archive.get("bvid")
            if not bvid:
                continue
            programs.append({
                "id": f"bili-series-{season_id}-{bvid}",
                "title": clean_text(archive.get("title") or "B站合集视频"),
                "source": "bilibili",
                "bvid": bvid,
                "cid": "",
                "page": 1,
                "duration": clamp_int(archive.get("duration"), 45, 86400, 1200),
                "skipStart": 0,
                "skipEnd": 0,
                "tags": ["B站", "合集", title],
            })
        if len(archives) < 100:
            break
    return {"title": title, "kind": "space_series", "programs": programs}


def normalize_bili_duration(value, fallback):
    number = clamp_int(value, 5, 86400000, fallback)
    if number > 86400:
        return max(5, int(number / 1000))
    return number


def bili_headers():
    return {
        "Referer": "https://www.bilibili.com/",
        "Origin": "https://www.bilibili.com",
    }


def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS app_config (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        """)
        row = conn.execute("SELECT value FROM app_config WHERE key = ?", ("channels",)).fetchone()
        if row is None:
            conn.execute(
                "INSERT INTO app_config (key, value) VALUES (?, ?)",
                ("channels", json.dumps(DEFAULT_CHANNELS, ensure_ascii=False)),
            )


def get_channels():
    with sqlite3.connect(DB_PATH) as conn:
        row = conn.execute("SELECT value FROM app_config WHERE key = ?", ("channels",)).fetchone()
    if not row:
        return DEFAULT_CHANNELS
    try:
        channels = json.loads(row[0])
    except json.JSONDecodeError:
        return DEFAULT_CHANNELS
    return normalize_channels(channels)


def save_channels(channels):
    normalized = normalize_channels(channels)
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            INSERT INTO app_config (key, value, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(key) DO UPDATE SET
                value = excluded.value,
                updated_at = CURRENT_TIMESTAMP
            """,
            ("channels", json.dumps(normalized, ensure_ascii=False)),
        )


def normalize_channels(channels):
    clean = []
    for index, channel in enumerate(channels):
        programs = normalize_programs(channel.get("programs") or [])
        if not programs:
            programs = normalize_programs(DEFAULT_CHANNELS[0]["programs"])
        clean.append({
            "id": str(channel.get("id") or f"channel-{index + 1}"),
            "order": int(channel.get("order") or index + 1),
            "name": str(channel.get("name") or f"频道 {index + 1}"),
            "description": str(channel.get("description") or "未命名频道。"),
            "tags": normalize_list(channel.get("tags")),
            "scoutTerms": normalize_list(channel.get("scoutTerms")),
            "programs": programs,
        })
    clean.sort(key=lambda item: item["order"])
    for index, channel in enumerate(clean, start=1):
        channel["order"] = index
    return clean


def normalize_programs(programs):
    clean = []
    for index, program in enumerate(programs):
        source = program.get("source") if program.get("source") in {"youtube", "bilibili", "direct", "iframe"} else "direct"
        duration = clamp_int(program.get("duration"), 5, 86400, 300)
        skip_start = clamp_int(program.get("skipStart"), 0, duration - 1, 0)
        skip_end = clamp_int(program.get("skipEnd"), 0, duration - skip_start - 1, 0)
        item = {
            "id": str(program.get("id") or f"program-{index + 1}"),
            "title": str(program.get("title") or f"节目 {index + 1}"),
            "source": source,
            "videoId": str(program.get("videoId") or ""),
            "bvid": str(program.get("bvid") or ""),
            "cid": str(program.get("cid") or ""),
            "page": clamp_int(program.get("page"), 1, 9999, 1),
            "url": str(program.get("url") or ""),
            "duration": duration,
            "skipStart": skip_start,
            "skipEnd": skip_end,
            "tags": normalize_list(program.get("tags")),
        }
        if item["videoId"] or item["bvid"] or item["url"]:
            clean.append(item)
    return clean


def normalize_list(value):
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    return [part.strip() for part in str(value or "").replace("，", ",").split(",") if part.strip()]


def run_searchers(query):
    executor = ThreadPoolExecutor(max_workers=2)
    futures = {
        executor.submit(search_bilibili, query): "bilibili",
        executor.submit(search_youtube, query): "youtube",
    }
    done, pending = wait(futures, timeout=SEARCH_DEADLINE)

    programs = []
    errors = []
    for future in done:
        name = futures[future]
        try:
            programs.extend(future.result())
        except Exception as exc:
            errors.append(f"{name}: {exc}")

    for future in pending:
        errors.append(f"{futures[future]}: timeout")
        future.cancel()

    executor.shutdown(wait=False, cancel_futures=True)
    return programs, errors


def search_bilibili(query):
    params = {"search_type": "video", "keyword": query, "page": "1"}
    url = f"https://api.bilibili.com/x/web-interface/search/type?{urlencode(params)}"
    payload = fetch_json(url, headers={
        "Referer": "https://www.bilibili.com/",
        "Origin": "https://www.bilibili.com",
    })
    results = payload.get("data", {}).get("result", []) or []
    programs = []
    for item in results[:8]:
        bvid = item.get("bvid")
        if not bvid:
            continue
        programs.append({
            "id": f"bili-{bvid}",
            "title": clean_text(item.get("title") or "B站视频"),
            "source": "bilibili",
            "bvid": bvid,
            "duration": clamp_int(parse_duration(item.get("duration")), 45, 1200, 300),
            "skipStart": 0,
            "skipEnd": 0,
            "tags": tokenize(f"{query} {item.get('tag', '')} {item.get('author', '')}"),
        })
    return programs


def fetch_json(url, headers=None):
    request_headers = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"
        ),
        "Accept": "application/json,text/plain,*/*",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.7",
    }
    request_headers.update(headers or {})
    req = Request(url, headers=request_headers)
    with urlopen(req, timeout=TIMEOUT) as response:
        charset = response.headers.get_content_charset() or "utf-8"
        return json.loads(response.read().decode(charset, errors="replace"))


def dedupe(programs):
    seen = set()
    unique = []
    for program in programs:
        key = program.get("id") or f"{program.get('source')}-{program.get('videoId') or program.get('bvid')}"
        if key in seen:
            continue
        seen.add(key)
        unique.append(program)
    return unique


def clean_text(value):
    text = re.sub(r"<[^>]+>", "", str(value))
    return unescape(text).strip()


def tokenize(text):
    cleaned = re.sub(r"[^\w\u4e00-\u9fff\s-]", " ", str(text).lower())
    return [part for part in cleaned.split() if len(part) > 1][:12]


def parse_duration(value):
    if isinstance(value, (int, float)):
        return int(value)
    parts = [int(part) for part in re.findall(r"\d+", str(value or ""))]
    if len(parts) == 3:
        return parts[0] * 3600 + parts[1] * 60 + parts[2]
    if len(parts) == 2:
        return parts[0] * 60 + parts[1]
    if len(parts) == 1:
        return parts[0]
    return 300


def clamp_int(value, minimum, maximum, fallback):
    try:
        number = int(value)
    except (TypeError, ValueError):
        number = fallback
    return max(minimum, min(maximum, number))


def extract_youtube_id(value):
    match = re.search(r"(?:v=|/watch/|/embed/|youtu\.be/)([a-zA-Z0-9_-]{8,})", str(value))
    return match.group(1) if match else None


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else PORT
    init_db()
    server = ThreadingHTTPServer(("0.0.0.0", port), RetroTVHandler)
    print(f"复古频道电视服务已启动：http://localhost:{port}/")
    print("同一局域网其他设备可用本机 IP 访问同一端口，看到同一份频道数据库。")
    print(f"频道数据库：{DB_PATH}")
    print("搜源接口：http://localhost:%s/api/search?q=复古街机" % port)
    server.serve_forever()


if __name__ == "__main__":
    main()
