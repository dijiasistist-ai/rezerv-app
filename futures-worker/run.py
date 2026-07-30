from avax_bot import Bot, Settings


def main() -> None:
    settings = Settings()
    if not settings.enabled:
        raise RuntimeError("Tyee futures worker is disabled")
    Bot(settings).run_forever()


if __name__ == "__main__":
    main()
