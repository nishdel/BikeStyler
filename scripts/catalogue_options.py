"""Display explicit supplier variant options without inventing combinations."""


def variant_label(variant):
    """Return a readable label for one source variant; never mutate its options.

    Prefer nonempty explicit options, in supplied order, formatted as
    'Name: Value' joined with ' · '. Omit a Title=Default Title option.
    Collapse whitespace in names/values; preserve punctuation, Unicode and zero.
    If no meaningful options remain, use a nonempty non-default name, otherwise
    'Standard'. Do not interpret dimensions, colours, availability or fitment.
    """
    def clean(value):
        return " ".join(str(value).split()) if value is not None else ""

    labels = []
    for name, value in (variant.get("options") or {}).items():
        name, value = clean(name), clean(value)
        if not name or not value or (name.casefold() == "title" and value.casefold() == "default title"):
            continue
        labels.append(f"{name}: {value}")
    if labels:
        return " · ".join(labels)
    fallback = clean(variant.get("name"))
    return fallback if fallback and fallback.casefold() != "default title" else "Standard"
