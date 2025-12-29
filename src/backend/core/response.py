"""
统一API响应格式
定义标准的响应模型和中间件
"""

from typing import Any, Generic, TypeVar

from fastapi import status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    """
    统一API响应格式
    
    Attributes:
        success: 请求是否成功
        data: 响应数据
        message: 提示信息
        code: 业务错误码（错误时必需）
    """
    
    success: bool = Field(..., description="请求是否成功")
    data: T | None = Field(None, description="响应数据")
    message: str | None = Field(None, description="提示信息")
    code: str | None = Field(None, description="业务错误码")

    class Config:
        json_schema_extra = {
            "examples": [
                {
                    "success": True,
                    "data": {"id": 1, "name": "示例"},
                    "message": "操作成功",
                },
                {
                    "success": False,
                    "message": "操作失败",
                    "code": "OPERATION_FAILED",
                },
            ],
        }


class SuccessResponse(BaseModel, Generic[T]):
    """成功响应"""
    
    success: bool = Field(True, description="请求成功标记")
    data: T = Field(..., description="响应数据")
    message: str | None = Field(None, description="提示信息")


class ErrorResponse(BaseModel):
    """错误响应"""
    
    success: bool = Field(False, description="请求失败标记")
    code: str = Field(..., description="错误码")
    message: str = Field(..., description="错误信息")
    details: dict[str, Any] | None = Field(None, description="详细错误信息")


class MessageResponse(BaseModel):
    """消息响应（用于删除等操作）"""
    
    success: bool = Field(True, description="请求成功标记")
    message: str = Field(..., description="操作结果消息")


def success_response(
    data: Any = None,
    message: str | None = None,
    status_code: int = status.HTTP_200_OK,
) -> JSONResponse:
    """
    创建成功响应
    
    Args:
        data: 响应数据
        message: 提示信息
        status_code: HTTP状态码
        
    Returns:
        JSONResponse: 标准格式的成功响应
    """
    content = {
        "success": True,
        "data": data,
    }
    if message:
        content["message"] = message
        
    return JSONResponse(
        status_code=status_code,
        content=content,
    )


def error_response(
    code: str,
    message: str,
    status_code: int = status.HTTP_400_BAD_REQUEST,
    details: dict[str, Any] | None = None,
) -> JSONResponse:
    """
    创建错误响应
    
    Args:
        code: 错误码
        message: 错误信息
        status_code: HTTP状态码
        details: 详细错误信息
        
    Returns:
        JSONResponse: 标准格式的错误响应
    """
    content = {
        "success": False,
        "code": code,
        "message": message,
    }
    if details:
        content["details"] = details
        
    return JSONResponse(
        status_code=status_code,
        content=content,
    )


def message_response(
    message: str,
    status_code: int = status.HTTP_200_OK,
) -> JSONResponse:
    """
    创建消息响应（用于删除等操作）
    
    Args:
        message: 操作结果消息
        status_code: HTTP状态码
        
    Returns:
        JSONResponse: 标准格式的消息响应
    """
    return JSONResponse(
        status_code=status_code,
        content={
            "success": True,
            "message": message,
        },
    )
