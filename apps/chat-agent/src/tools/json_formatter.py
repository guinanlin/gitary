from __future__ import annotations
import json
from typing import List, Dict, Any, Optional


def format_image_results_json(
    total_images: int,
    image_results: List[Dict[str, Any]]
) -> dict:
    """将图片处理结果格式化为标准JSON格式
    
    这个工具用于确保输出的JSON格式完全正确且可解析。
    它会验证输入数据的格式，并返回标准化的JSON结构。
    
    Args:
        total_images: 图片总数（整数）
        image_results: 图片结果列表，每个元素应包含：
            - image_index: 图片序号（整数，从1开始）
            - image_url: 图片URL（字符串，可选）
            - understanding: 图片理解结果（字符串）
            - narration_script: 口播文案（字符串，300-400字）
    
    Returns:
        dict: {
            "status": "success" | "error",
            "result": {
                "total_images": int,
                "images": List[dict]
            } | None,
            "error_message": str | None
        }
    
    Example:
        >>> result = format_image_results_json(
        ...     total_images=2,
        ...     image_results=[
        ...         {
        ...             "image_index": 1,
        ...             "image_url": "https://example.com/img1.jpg",
        ...             "understanding": "这是一张图片的理解",
        ...             "narration_script": "这是口播文案..."
        ...         }
        ...     ]
        ... )
    """
    try:
        if not isinstance(total_images, int) or total_images < 0:
            return {
                "status": "error",
                "error_message": f"total_images必须是大于等于0的整数，当前值：{total_images}"
            }
        
        if not isinstance(image_results, list):
            return {
                "status": "error",
                "error_message": f"image_results必须是列表类型，当前类型：{type(image_results).__name__}"
            }
        
        if len(image_results) != total_images:
            return {
                "status": "error",
                "error_message": f"image_results的长度({len(image_results)})与total_images({total_images})不匹配"
            }
        
        formatted_images = []
        errors = []
        
        for idx, item in enumerate(image_results, 1):
            if not isinstance(item, dict):
                errors.append(f"第{idx}项必须是字典类型")
                continue
            
            image_index = item.get("image_index")
            image_url = item.get("image_url", "")
            understanding = item.get("understanding", "")
            narration_script = item.get("narration_script", "")
            
            if not isinstance(image_index, int) or image_index < 1:
                errors.append(f"第{idx}项的image_index必须是大于等于1的整数")
                continue
            
            if image_index != idx:
                errors.append(f"第{idx}项的image_index({image_index})与位置索引({idx})不匹配")
            
            if not isinstance(image_url, str):
                image_url = str(image_url) if image_url is not None else ""
            
            if not isinstance(understanding, str):
                errors.append(f"第{idx}项的understanding必须是字符串类型")
                continue
            
            if not understanding.strip():
                errors.append(f"第{idx}项的understanding不能为空")
                continue
            
            if not isinstance(narration_script, str):
                errors.append(f"第{idx}项的narration_script必须是字符串类型")
                continue
            
            if not narration_script.strip():
                errors.append(f"第{idx}项的narration_script不能为空")
                continue
            
            word_count = len(narration_script)
            if word_count < 200 or word_count > 500:
                errors.append(f"第{idx}项的口播文案字数({word_count})不在推荐范围内(300-400字)")
            
            formatted_images.append({
                "image_index": image_index,
                "image_url": image_url,
                "understanding": understanding,
                "narration_script": narration_script
            })
        
        if errors:
            return {
                "status": "error",
                "error_message": "格式化过程中发现以下错误：\n" + "\n".join(errors),
                "result": None
            }
        
        result = {
            "total_images": total_images,
            "images": formatted_images
        }
        
        return {
            "status": "success",
            "result": result
        }
    
    except Exception as e:
        return {
            "status": "error",
            "error_message": f"格式化JSON时发生错误：{str(e)}",
            "result": None
        }

