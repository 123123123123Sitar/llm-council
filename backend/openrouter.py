"""OpenRouter API client for making LLM requests."""

import httpx
from typing import List, Dict, Any, Optional
from .config import OPENROUTER_API_KEY, OPENROUTER_API_URL


async def query_model(
    model: str,
    messages: List[Dict[str, Any]],
    timeout: float = 120.0
) -> Optional[Dict[str, Any]]:
    """
    Query a single model via OpenRouter API.

    Args:
        model: OpenRouter model identifier (e.g., "openai/gpt-4o")
        messages: List of message dicts with 'role' and 'content' (str or list)
        timeout: Request timeout in seconds
    
    Returns:
        Dict with 'role' and 'content', or None if failed
    """
    
    if not OPENROUTER_API_KEY:
        print(f"Error: OPENROUTER_API_KEY is not set")
        return None

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "HTTP-Referer": "https://github.com/Start-Impulse/llm-council",
        "X-Title": "LLM Council",
        "Content-Type": "application/json"
    }

    payload = {
        "model": model,
        "messages": messages
    }

    retries = 3
    base_delay = 2

    for attempt in range(retries):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    OPENROUTER_API_URL,
                    json=payload,
                    headers=headers,
                    timeout=timeout
                )
                
                if response.status_code == 429:
                    if attempt < retries - 1:
                        import asyncio
                        wait_time = base_delay * (2 ** attempt)
                        print(f"Rate limited on {model}, retrying in {wait_time}s...")
                        await asyncio.sleep(wait_time)
                        continue
                
                if response.status_code != 200:
                    print(f"Error querying {model}: {response.status_code} - {response.text}")
                    return None
                
                data = response.json()
                if not data or 'choices' not in data or not data['choices']:
                    print(f"Error querying {model}: Invalid response format - {data}")
                    return None
                    
                return data["choices"][0]["message"]
                
        except Exception as e:
            print(f"Exception querying {model}: {e}")
            if attempt < retries - 1:
                import asyncio
                await asyncio.sleep(1)
            else:
                return None
    return None


async def query_models_parallel(
    models: List[str],
    messages: List[Dict[str, Any]]
) -> Dict[str, Optional[Dict[str, Any]]]:
    """
    Query multiple models in parallel.

    Args:
        models: List of OpenRouter model identifiers
        messages: List of message dicts to send to each model (content can be str or list)

    Returns:
        Dict mapping model identifier to response dict (or None if failed)
    """
    import asyncio

    # Create tasks for all models
    tasks = [query_model(model, messages) for model in models]

    # Wait for all to complete
    responses = await asyncio.gather(*tasks)

    # Map models to their responses
    return {model: response for model, response in zip(models, responses)}
