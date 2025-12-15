from __future__ import annotations
import os
import json
import requests
from typing import List, Dict, Any


def query_sku_by_api(items_json: str) -> dict:
    """调用ERPNext API查询SKU信息
    
    Args:
        items_json: SKU数据的JSON字符串，格式为包含items数组的JSON对象
        例如: '{"items": [{"sku_code": "IW-10200 涤粘弹面料", "color": "黑棕格"}]}'
        或者直接是items数组的JSON字符串: '[{"sku_code": "IW-10200 涤粘弹面料", "color": "黑棕格"}]'
    
    Returns:
        dict: {
            "status": "success" | "error",
            "results": List[dict] | None,  # API返回的查询结果
            "error_message": str | None
        }
    """
    try:
        parsed_data = json.loads(items_json)
    except json.JSONDecodeError as e:
        return {
            "status": "error",
            "error_message": f"items_json不是有效的JSON格式：{str(e)}"
        }
    
    if isinstance(parsed_data, dict) and "items" in parsed_data:
        items_data = parsed_data["items"]
    elif isinstance(parsed_data, list):
        items_data = parsed_data
    else:
        return {
            "status": "error",
            "error_message": "items_json必须包含items数组或本身就是一个数组"
        }
    
    if not items_data or not isinstance(items_data, list):
        return {
            "status": "error",
            "error_message": "items必须是一个非空列表"
        }
    
    if len(items_data) == 0:
        return {
            "status": "error",
            "error_message": "items列表不能为空"
        }
    
    for item in items_data:
        if not isinstance(item, dict):
            return {
                "status": "error",
                "error_message": "items中的每个元素必须是字典类型"
            }
        
        if "sku_code" not in item or "color" not in item:
            return {
                "status": "error",
                "error_message": "items中的每个元素必须包含sku_code和color字段"
            }
    
    api_base_url = os.getenv(
        "ERPNEXT_API_BASE_URL",
        "http://127.0.0.1:8123"
    ).rstrip('/')
    
    api_endpoint = os.getenv(
        "ERPNEXT_API_ENDPOINT",
        "/erpnext/resource?endpoint=%2Fapi%2Fmethod%2Frongguan_erp.utils.api.item.item_api_for_agent.get_items_by_sku_and_color&method=POST&full_model_fields=true"
    )
    
    if not api_endpoint.startswith('/'):
        api_endpoint = '/' + api_endpoint
    
    api_url = f"{api_base_url}{api_endpoint}"
    
    request_data = {
        "data": {},
        "json_data": {
            "items_data": [
                {
                    "sku_code": item["sku_code"],
                    "color": item["color"]
                }
                for item in items_data
            ]
        }
    }
    
    headers = {
        "accept": "application/json",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(
            api_url,
            headers=headers,
            json=request_data,
            timeout=5
        )
        
        response.raise_for_status()
        
        result_data = response.json()
        
        if isinstance(result_data, dict) and "data" in result_data:
            message = result_data.get("data", {}).get("message", [])
            return {
                "status": "success",
                "results": message if isinstance(message, list) else []
            }
        else:
            return {
                "status": "success",
                "results": []
            }
    
    except requests.exceptions.Timeout:
        return {
            "status": "error",
            "error_message": "API请求超时（5秒），请稍后重试"
        }
    
    except requests.exceptions.ConnectionError:
        return {
            "status": "error",
            "error_message": f"无法连接到API服务器（{api_base_url}），请检查网络连接和服务器状态"
        }
    
    except requests.exceptions.HTTPError as e:
        status_code = e.response.status_code if e.response else "unknown"
        try:
            error_detail = e.response.json() if e.response else {}
            error_msg = error_detail.get("message", str(e))
        except:
            error_msg = str(e)
        
        return {
            "status": "error",
            "error_message": f"API请求失败（HTTP {status_code}）：{error_msg}"
        }
    
    except requests.exceptions.RequestException as e:
        return {
            "status": "error",
            "error_message": f"API请求失败：{str(e)}"
        }
    
    except Exception as e:
        return {
            "status": "error",
            "error_message": f"发生未知错误：{str(e)}"
        }
