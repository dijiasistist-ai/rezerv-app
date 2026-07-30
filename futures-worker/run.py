import logging

from avax_bot import Bot, Settings


def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
    settings = Settings()
    if not settings.enabled:
        raise RuntimeError("Tyee futures worker is disabled")
    Bot(settings).run_forever()


if __name__ == "__main__":
    main()
