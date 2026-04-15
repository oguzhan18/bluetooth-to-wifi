from __future__ import annotations

from btw_core.exceptions import ParseError
from btw_core.models import DeviceReading
from btw_core.parsers.builtin import (
    BinarySwitchParser,
    HumidityParser,
    RawBytesParser,
    TemperatureInt16Parser,
)
from btw_core.ports import PayloadParser


class ParserRegistry:
    def __init__(self, parsers: list[PayloadParser] | None = None) -> None:
        self._parsers: list[PayloadParser] = list(parsers or [])

    def register(self, p: PayloadParser) -> None:
        self._parsers.insert(0, p)

    def parse(
        self,
        service_uuid: str | None,
        characteristic_uuid: str | None,
        raw: bytes,
    ) -> DeviceReading:
        for p in self._parsers:
            if p.supports(service_uuid, characteristic_uuid, raw):
                return p.parse(service_uuid, characteristic_uuid, raw)
        raise ParseError("no parser matched")


def default_registry() -> ParserRegistry:
    reg = ParserRegistry(
        [
            TemperatureInt16Parser(),
            HumidityParser(),
            BinarySwitchParser(),
            RawBytesParser(),
        ]
    )
    return reg
