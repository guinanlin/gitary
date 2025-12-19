from __future__ import annotations
from typing import List, Dict, Any


def process_ppt_pages(
    ppt_pages: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """处理PPT页面数据，验证格式并返回结构化数据供Agent处理
    
    这个工具接收JSON格式的PPT页面数据，验证格式后返回给Agent进行串行处理。
    Agent会依次处理每页，结合备注信息和上下文生成口播文案。
    
    Args:
        ppt_pages: PPT页面列表，每个元素必须包含：
            - page_index (int): 页面序号，从1开始
            - image_url (str): 图片地址（HTTP/HTTPS URL 或 base64 data URL）
            - notes (str, optional): 备注信息，可能为空字符串
    
    Returns:
        dict: {
            "status": "success" | "error",
            "total_pages": int,
            "pages": List[Dict] | None,
            "error_message": str | None
        }
    
    Example:
        >>> result = process_ppt_pages([
        ...     {
        ...         "page_index": 1,
        ...         "image_url": "https://example.com/page1.jpg",
        ...         "notes": "这是第一页的备注"
        ...     },
        ...     {
        ...         "page_index": 2,
        ...         "image_url": "https://example.com/page2.jpg",
        ...         "notes": ""
        ...     }
        ... ])
    """
    try:
        if not isinstance(ppt_pages, list):
            return {
                "status": "error",
                "error_message": f"ppt_pages必须是列表类型，当前类型：{type(ppt_pages).__name__}"
            }
        
        if len(ppt_pages) == 0:
            return {
                "status": "error",
                "error_message": "ppt_pages不能为空列表"
            }
        
        validated_pages = []
        errors = []
        
        for idx, page in enumerate(ppt_pages, 1):
            if not isinstance(page, dict):
                errors.append(f"第{idx}项必须是字典类型")
                continue
            
            page_index = page.get("page_index")
            image_url = page.get("image_url")
            notes = page.get("notes", "")
            
            if not isinstance(page_index, int) or page_index < 1:
                errors.append(f"第{idx}项的page_index必须是大于等于1的整数")
                continue
            
            if page_index != idx:
                errors.append(f"第{idx}项的page_index({page_index})与位置索引({idx})不匹配，建议修正为{idx}")
            
            if not isinstance(image_url, str) or not image_url.strip():
                errors.append(f"第{idx}项的image_url必须是非空字符串")
                continue
            
            if not isinstance(notes, str):
                notes = str(notes) if notes is not None else ""
            
            validated_pages.append({
                "page_index": page_index,
                "image_url": image_url.strip(),
                "notes": notes.strip()
            })
        
        if errors:
            return {
                "status": "error",
                "error_message": "验证过程中发现以下错误：\n" + "\n".join(errors),
                "total_pages": 0,
                "pages": None
            }
        
        return {
            "status": "success",
            "total_pages": len(validated_pages),
            "pages": validated_pages,
            "error_message": None
        }
    
    except Exception as e:
        return {
            "status": "error",
            "error_message": f"处理PPT页面数据时发生错误：{str(e)}",
            "total_pages": 0,
            "pages": None
        }
