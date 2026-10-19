"""Display explicit supplier variant options without inventing combinations."""


def variant_label(variant):
    """Return a readable label for one source variant; never mutate its options.

    Prefer nonempty explicit options, in supplied order, formatted as
    'Name: Value' joined with ' · '. Omit a Title=Default Title option.
    Collapse whitespace in names/values; preserve punctuation, Unicode and zero.
    If no meaningful options remain, use a nonempty non-default name, otherwise
    'Standard'. Do not interpret dimensions, colours, availability or fitment.
    """
    return variant.get("name", "Standard")
