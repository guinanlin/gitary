from __future__ import annotations
import json
import re
from typing import List, Dict, Any


def parse_sku_data(sku_input: str) -> dict:
    """解析SKU信息并转换为标准化JSON格式
    
    支持三种输入格式：
    1. JSON格式：已结构化的JSON字符串
    2. 表格格式：包含表头（品类、单耗/m、颜色）的表格数据，使用制表符或空格分隔
    3. 文本格式：自由文本描述，格式为"品类：xxx，颜色：xxx"
    
    Args:
        sku_input: SKU信息字符串，支持表格、文本或JSON格式
    
    Returns:
        dict: {
            "status": "success" | "error",
            "data": {"items": [{"sku_code": str, "color": str}]} | None,
            "error_message": str | None
        }
    """
    if not sku_input or not sku_input.strip():
        return {
            "status": "error",
            "error_message": "输入内容不能为空"
        }
    
    items = []
    
    try:
        json_data = json.loads(sku_input.strip())
        if isinstance(json_data, dict) and "items" in json_data:
            items = json_data["items"]
        elif isinstance(json_data, list):
            items = json_data
        else:
            raise ValueError("JSON格式不正确，应包含items数组")
    except (json.JSONDecodeError, ValueError, TypeError):
        items = _try_parse_table_format(sku_input)
        if not items:
            items = _try_parse_text_format(sku_input)
    
    if not items:
        return {
            "status": "error",
            "error_message": "无法识别输入格式。请提供以下格式之一：\n"
                           "1. 表格格式（包含表头：品类、颜色）\n"
                           "2. 文本格式：品类：xxx，颜色：xxx\n"
                           "3. JSON格式：{\"items\": [{\"sku_code\": \"xxx\", \"color\": \"xxx\"}]}"
        }
    
    validated_items = []
    errors = []
    
    for idx, item in enumerate(items, 1):
        if isinstance(item, dict):
            sku_code = item.get("sku_code") or item.get("品类") or ""
            color = item.get("color") or item.get("颜色") or ""
        elif isinstance(item, (list, tuple)) and len(item) >= 2:
            sku_code = str(item[0]).strip()
            color = str(item[1]).strip()
        else:
            errors.append(f"第{idx}项数据格式不正确")
            continue
        
        valid, error_msg = _validate_sku_item(sku_code, color)
        if valid:
            validated_items.append({
                "sku_code": sku_code.strip(),
                "color": color.strip()
            })
        else:
            errors.append(f"第{idx}项：{error_msg}")
    
    if not validated_items:
        error_msg = "没有有效的SKU数据。"
        if errors:
            error_msg += "\n错误详情：\n" + "\n".join(errors)
        return {
            "status": "error",
            "error_message": error_msg
        }
    
    if errors:
        return {
            "status": "success",
            "data": {"items": validated_items},
            "warning": "部分数据解析失败：\n" + "\n".join(errors)
        }
    
    return {
        "status": "success",
        "data": {"items": validated_items}
    }


def _try_parse_table_format(text: str) -> List[Dict[str, str]]:
    """尝试解析表格格式的SKU数据"""
    lines = [line.strip() for line in text.strip().split('\n') if line.strip()]
    
    if len(lines) < 2:
        return []
    
    header_line = lines[0]
    
    separators = ['\t', '  ', '|', ',']
    header = None
    separator = None
    
    for sep in separators:
        if sep in header_line:
            header = [col.strip() for col in header_line.split(sep)]
            separator = sep
            break
    
    if not header or not separator:
        return []
    
    category_idx = None
    color_idx = None
    
    for idx, col in enumerate(header):
        col_lower = col.lower()
        if '品类' in col or 'sku' in col_lower or 'code' in col_lower:
            category_idx = idx
        elif '颜色' in col or 'color' in col_lower:
            color_idx = idx
    
    if category_idx is None or color_idx is None:
        return []
    
    items = []
    for line in lines[1:]:
        if not line.strip():
            continue
        
        cols = [col.strip() for col in line.split(separator)]
        if len(cols) > max(category_idx, color_idx):
            category = cols[category_idx] if category_idx < len(cols) else ""
            color = cols[color_idx] if color_idx < len(cols) else ""
            
            if category or color:
                items.append({
                    "sku_code": category,
                    "color": color
                })
    
    return items


def _try_parse_text_format(text: str) -> List[Dict[str, str]]:
    """尝试解析文本格式的SKU数据"""
    items = []
    
    patterns = [
        r'品类[：:]\s*([^，,\n]+)[，,]\s*颜色[：:]\s*([^，,\n]+)',
        r'品类[：:]\s*([^，,\n]+).*?颜色[：:]\s*([^，,\n]+)',
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, text)
        for match in matches:
            if len(match) == 2:
                items.append({
                    "sku_code": match[0].strip(),
                    "color": match[1].strip()
                })
        
        if items:
            break
    
    if not items:
        lines = text.split('\n')
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            for pattern in patterns:
                match = re.search(pattern, line)
                if match:
                    items.append({
                        "sku_code": match.group(1).strip(),
                        "color": match.group(2).strip()
                    })
                    break
    
    return items


def _validate_sku_item(sku_code: str, color: str) -> tuple[bool, str]:
    """验证SKU项数据
    
    Returns:
        tuple[bool, str]: (是否有效, 错误信息)
    """
    if not sku_code or not sku_code.strip():
        return False, "品类字段不能为空"
    
    if not color or not color.strip():
        return False, "颜色字段不能为空"
    
    return True, ""
