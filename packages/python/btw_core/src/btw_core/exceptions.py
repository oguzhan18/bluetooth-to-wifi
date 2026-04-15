class BtwError(Exception):
    pass


class BleNotConnected(BtwError):
    pass


class ParseError(BtwError):
    pass


class ConfigurationError(BtwError):
    pass
