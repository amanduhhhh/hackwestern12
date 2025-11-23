import inspect
from typing import Any, Dict, List, Callable
from functools import wraps


def tool_function(description: str, params: Dict[str, Dict[str, str]] = None):
    """
    Decorator to mark a method as an LLM tool with explicit metadata.

    Args:
        description: LLM-friendly description of what the function does
        params: Dict mapping param names to their schema
                e.g., {"symbol": {"type": "string", "description": "Stock ticker (e.g., AAPL, TSLA)"}}

    Example:
        @tool_function(
            description="Get stock price and company info for a ticker symbol",
            params={
                "symbol": {
                    "type": "string",
                    "description": "Stock ticker symbol (e.g., AAPL, TSLA, GOOGL)"
                }
            }
        )
        def fetch_stock_info(self, symbol: str):
            ...
    """
    def decorator(func):
        func._tool_metadata = {
            "description": description,
            "params": params or {}
        }
        @wraps(func)
        def wrapper(*args, **kwargs):
            return func(*args, **kwargs)
        wrapper._tool_metadata = func._tool_metadata
        return wrapper
    return decorator


def generate_tools_from_fetchers(
    fetchers: Dict[str, Any]
) -> tuple[List[Dict[str, Any]], Dict[str, Callable]]:
    """
    Generate LiteLLM tool schemas from fetcher instances.
    Prefers decorator metadata, falls back to inspect-based generation.
    """
    tools = []
    available_functions = {}

    excluded_methods = {
        "is_authenticated", "clear_token", "search_team",
        "get_authorization_url", "fetch_token_from_code", "get_spotify_client"
    }

    for fetcher_name, fetcher in fetchers.items():
        methods = inspect.getmembers(fetcher, predicate=inspect.ismethod)

        for method_name, method in methods:
            if method_name.startswith("_") or method_name in excluded_methods:
                continue

            if not method_name.startswith("fetch_") and not method_name.startswith("get_"):
                continue

            tool_name = f"{fetcher_name}_{method_name}"

            # Check for decorator metadata first
            if hasattr(method, "_tool_metadata"):
                metadata = method._tool_metadata
                tool_schema = {
                    "type": "function",
                    "function": {
                        "name": tool_name,
                        "description": metadata["description"]
                    }
                }

                if metadata["params"]:
                    required = []
                    sig = inspect.signature(method)
                    for param_name in metadata["params"]:
                        if param_name in sig.parameters:
                            if sig.parameters[param_name].default == inspect.Parameter.empty:
                                required.append(param_name)

                    tool_schema["function"]["parameters"] = {
                        "type": "object",
                        "properties": metadata["params"],
                        "required": required
                    }
            else:
                # Fallback to inspect-based generation (legacy)
                # TODO: Add @tool_function decorators to all fetcher methods
                doc = inspect.getdoc(method) or f"Get data from {fetcher_name}"

                sig = inspect.signature(method)
                params = {}
                required_params = []

                for param_name, param in sig.parameters.items():
                    if param_name == "self":
                        continue

                    param_type = "string"
                    # TODO: Read from API docs for proper descriptions
                    param_desc = f"Parameter {param_name}"

                    annotation = param.annotation
                    if annotation != inspect.Parameter.empty:
                        if annotation == str:
                            param_type = "string"
                        elif annotation == int:
                            param_type = "integer"
                        elif annotation == float:
                            param_type = "number"
                        elif annotation == bool:
                            param_type = "boolean"
                        elif hasattr(annotation, "__origin__") and annotation.__origin__ == list:
                            params[param_name] = {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": f"List of {param_name}"
                            }
                            if param.default == inspect.Parameter.empty:
                                required_params.append(param_name)
                            continue

                    params[param_name] = {"type": param_type, "description": param_desc}

                    if param.default == inspect.Parameter.empty:
                        required_params.append(param_name)

                tool_schema = {
                    "type": "function",
                    "function": {
                        "name": tool_name,
                        "description": doc.split('\n')[0] if doc else f"Execute {method_name}"
                    }
                }

                if params:
                    tool_schema["function"]["parameters"] = {
                        "type": "object",
                        "properties": params,
                        "required": required_params
                    }

            tools.append(tool_schema)
            available_functions[tool_name] = method

    return tools, available_functions
