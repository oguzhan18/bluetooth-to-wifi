from __future__ import annotations

import argparse
import os

import uvicorn

from btw_api.app import create_app


def main() -> None:
    p = argparse.ArgumentParser(prog="btw-api")
    p.add_argument("--host", default=os.environ.get("BTW_HOST", "127.0.0.1"))
    p.add_argument("--port", type=int, default=int(os.environ.get("BTW_PORT", "8765")))
    args = p.parse_args()
    app = create_app()
    uvicorn.run(app, host=args.host, port=args.port, log_level="info")


if __name__ == "__main__":
    main()
