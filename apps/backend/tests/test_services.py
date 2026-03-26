from app.services import extract_article, lemmatize_word, parse_dictionary


def test_lemmatize_word_for_verb_noun_and_adjective() -> None:
    assert lemmatize_word("geht", "verb") == "gehen"
    assert lemmatize_word("Häuser", "noun") == "Häus"
    assert lemmatize_word("schönen", "adjective") == "schön"


def test_extract_article_for_nouns() -> None:
    assert extract_article("Mann", "Der Mann liest.", "noun") == "der"
    assert extract_article("Katze", "Die Katze schläft.", "noun") == "die"
    assert extract_article("Haus", "Das Haus ist groß.", "noun") == "das"
    assert extract_article("gehen", "Ich gehe nach Hause.", "verb") is None


def test_parse_dictionary_json_array() -> None:
    payload = """
    [
      {
        "german": "Haus",
        "english": "house",
        "type": "noun",
        "example": "Das Haus ist groß",
        "context": "The house is big",
        "article": "das"
      }
    ]
    """
    words = parse_dictionary("words.json", payload)
    assert len(words) == 1
    assert words[0].german == "Haus"
    assert words[0].type == "noun"
    assert words[0].article == "das"


def test_parse_dictionary_csv() -> None:
    payload = "\n".join(
        [
            "german,english,type,example,context,article",
            "Katze,cat,noun,Die Katze schläft,The cat sleeps,die",
        ]
    )
    words = parse_dictionary("words.csv", payload)
    assert len(words) == 1
    assert words[0].german == "Katze"
    assert words[0].english == "cat"
    assert words[0].article == "die"
