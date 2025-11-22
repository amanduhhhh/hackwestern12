import unittest
from utils import extract_complete_element, get_data


class TestExtractCompleteElement(unittest.TestCase):
    def test_simple_self_closing_tag(self):
        html = "<br/>rest of content"
        result = extract_complete_element(html)
        self.assertEqual(result, "<br/>")

    def test_component_slot_self_closing(self):
        html = (
            '<component-slot type="List" data-source="music::top_songs"/>more content'
        )
        result = extract_complete_element(html)
        self.assertEqual(
            result, '<component-slot type="List" data-source="music::top_songs"/>'
        )

    def test_simple_paired_tag(self):
        html = "<div>content</div>more"
        result = extract_complete_element(html)
        self.assertEqual(result, "<div>content</div>")

    def test_nested_tags(self):
        html = "<div><span>text</span></div>extra"
        result = extract_complete_element(html)
        self.assertEqual(result, "<div><span>text</span></div>")

    def test_deeply_nested_tags(self):
        html = "<div><p><span>text</span></p></div>rest"
        result = extract_complete_element(html)
        self.assertEqual(result, "<div><p><span>text</span></p></div>")

    def test_multiple_siblings(self):
        html = "<div><p>first</p><p>second</p></div>after"
        result = extract_complete_element(html)
        self.assertEqual(result, "<div><p>first</p><p>second</p></div>")

    def test_tag_with_attributes(self):
        html = '<div class="test" id="main">content</div>more'
        result = extract_complete_element(html)
        self.assertEqual(result, '<div class="test" id="main">content</div>')

    def test_empty_string(self):
        html = ""
        result = extract_complete_element(html)
        self.assertEqual(result, "")

    def test_incomplete_html(self):
        html = "<div>incomplete"
        result = extract_complete_element(html)
        self.assertEqual(result, "")

    def test_img_tag(self):
        html = '<img src="test.jpg"/>other content'
        result = extract_complete_element(html)
        self.assertEqual(result, '<img src="test.jpg"/>')

    def test_no_tags(self):
        html = "just text"
        result = extract_complete_element(html)
        self.assertEqual(result, "")


class TestGetData(unittest.TestCase):
    def setUp(self):
        self.mock_data = {
            "music": {
                "top_songs": [{"title": "Song 1"}, {"title": "Song 2"}],
                "total_minutes": 12345,
                "top_genres": ["Pop", "Rock"],
            },
            "fitness": {"workouts": 50, "total_minutes": 3000},
            "travel": {"cities": ["Tokyo", "Paris"]},
        }

    def test_single_source(self):
        sources = ["music::top_songs"]
        result = get_data(sources, self.mock_data)
        expected = {"music": {"top_songs": [{"title": "Song 1"}, {"title": "Song 2"}]}}
        self.assertEqual(result, expected)

    def test_multiple_sources_same_namespace(self):
        sources = ["music::top_songs", "music::top_genres"]
        result = get_data(sources, self.mock_data)
        expected = {
            "music": {
                "top_songs": [{"title": "Song 1"}, {"title": "Song 2"}],
                "top_genres": ["Pop", "Rock"],
            }
        }
        self.assertEqual(result, expected)

    def test_multiple_sources_different_namespaces(self):
        sources = ["music::top_songs", "fitness::workouts"]
        result = get_data(sources, self.mock_data)
        expected = {
            "music": {"top_songs": [{"title": "Song 1"}, {"title": "Song 2"}]},
            "fitness": {"workouts": 50},
        }
        self.assertEqual(result, expected)

    def test_nonexistent_namespace(self):
        sources = ["nonexistent::key"]
        result = get_data(sources, self.mock_data)
        expected = {"nonexistent": {}}
        self.assertEqual(result, expected)

    def test_nonexistent_key(self):
        sources = ["music::nonexistent_key"]
        result = get_data(sources, self.mock_data)
        expected = {"music": {}}
        self.assertEqual(result, expected)

    def test_empty_sources(self):
        sources = []
        result = get_data(sources, self.mock_data)
        self.assertEqual(result, {})

    def test_invalid_source_format(self):
        sources = ["invalid_format"]
        result = get_data(sources, self.mock_data)
        self.assertEqual(result, {})

    def test_source_with_multiple_colons(self):
        sources = ["namespace::key::extra"]
        result = get_data(sources, self.mock_data)
        self.assertEqual(result, {"namespace": {}})

    def test_all_data_from_one_namespace(self):
        sources = ["music::top_songs", "music::total_minutes", "music::top_genres"]
        result = get_data(sources, self.mock_data)
        expected = {
            "music": {
                "top_songs": [{"title": "Song 1"}, {"title": "Song 2"}],
                "total_minutes": 12345,
                "top_genres": ["Pop", "Rock"],
            }
        }
        self.assertEqual(result, expected)


if __name__ == "__main__":
    unittest.main()
