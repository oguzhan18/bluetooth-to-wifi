from btw_core.models import PayloadKind
from btw_core.parsers.registry import default_registry


def test_temperature() -> None:
    reg = default_registry()
    raw = (2500).to_bytes(2, "little", signed=True)
    r = reg.parse(None, "00002a6e-0000-1000-8000-00805f9b34fb", raw)
    assert r.kind == PayloadKind.TEMPERATURE_C
    assert r.data["value"] == 25.0


def test_switch() -> None:
    reg = default_registry()
    r = reg.parse(None, None, b"\x01")
    assert r.kind == PayloadKind.SWITCH
    assert r.data["on"] is True
