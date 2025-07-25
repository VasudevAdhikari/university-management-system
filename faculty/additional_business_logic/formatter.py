def get_avatar(full_name: str) -> str:
    return "".join(word[0] for word in full_name.split()).upper()[:2]
