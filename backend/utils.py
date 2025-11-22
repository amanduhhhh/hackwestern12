from typing import Dict, Any


def extract_complete_element(html: str) -> str:
    """Extract the first complete HTML element from a string."""
    stack = []
    i = 0

    while i < len(html):
        if html[i] == "<":
            end = html.find(">", i)
            if end == -1:
                break

            tag = html[i + 1 : end]

            if tag.startswith("/"):
                tag_name = tag[1:].split()[0]
                if stack and stack[-1] == tag_name:
                    stack.pop()
                    if not stack:
                        return html[: end + 1]
            elif tag.endswith("/") or tag.split()[0] in ["component-slot", "br", "img"]:
                if not stack:
                    return html[: end + 1]
            else:
                tag_name = tag.split()[0]
                stack.append(tag_name)

            i = end + 1
        else:
            i += 1

    return ""


def get_data(sources: list[str], mock_data: Dict[str, Any]) -> Dict[str, Any]:
    """Extract data from mock_data based on namespace::key sources."""
    result = {}

    for source in sources:
        if "::" not in source:
            continue

        namespace, key = source.split("::", 1)

        if namespace not in result:
            result[namespace] = {}

        if namespace in mock_data and key in mock_data[namespace]:
            result[namespace][key] = mock_data[namespace][key]

    return result
