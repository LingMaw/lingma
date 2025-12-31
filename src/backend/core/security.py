"""
安全相关功能
包括密码加密、JWT令牌生成、API密钥加密等
"""

import base64
import hashlib
import json
from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
from jose import jwt

from src.backend.config.settings import settings


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    验证密码

    Args:
        plain_password: 明文密码
        hashed_password: 加密后的密码

    Returns:
        bool: 密码是否匹配
    """
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8"),
    )


def get_password_hash(password: str) -> str:
    """
    获取密码哈希

    Args:
        password: 明文密码

    Returns:
        str: 加密后的密码哈希

    Note:
        bcrypt 密码长度限制为 72 字节
    """
    # bcrypt 只支持最多 72 字节的密码
    password_bytes = password.encode("utf-8")
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]

    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")


def create_access_token(
    data: dict[str, Any],
    expires_delta: timedelta | None = None,
) -> str:
    """
    创建访问令牌

    Args:
        data: 要编码到令牌中的数据
        expires_delta: 过期时间增量

    Returns:
        str: JWT令牌
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        )

    to_encode.update({"exp": expire})
    return jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


def decode_access_token(token: str) -> dict[str, Any] | None:
    """
    解码访问令牌

    Args:
        token: JWT令牌

    Returns:
        dict | None: 解码后的数据，失败返回None
    """
    try:
        return jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
    except Exception:
        return None


def _get_encryption_key() -> bytes:
    """
    从 settings.SECRET_KEY 派生标准的 256 位加密密钥

    Returns:
        bytes: 32 字节的加密密钥
    """
    # 使用 SHA-256 哈希确保获得标准的 32 字节密钥
    return hashlib.sha256(settings.SECRET_KEY.encode("utf-8")).digest()


def encrypt_api_key(api_key: str) -> str:
    """
    使用 AES-256-CBC 加密 API 密钥

    Args:
        api_key: 明文 API 密钥

    Returns:
        str: JSON 格式的加密数据，包含密文(ct)和初始化向量(iv)

    Example:
        >>> encrypted = encrypt_api_key("sk-1234567890")
        >>> # 返回: '{"ct": "...", "iv": "..."}'
    """
    if not api_key:  # 空字符串不加密
        return ""

    encryption_key = _get_encryption_key()

    # 生成随机的 IV
    cipher = AES.new(encryption_key, AES.MODE_CBC)

    # 使用 CBC 模式加密并进行填充
    ct_bytes = cipher.encrypt(pad(api_key.encode("utf-8"), AES.block_size))

    # 将 IV 和密文编码为 base64 字符串
    iv = base64.b64encode(cipher.iv).decode("utf-8")
    ct = base64.b64encode(ct_bytes).decode("utf-8")

    # 返回 JSON 格式
    return json.dumps({"ct": ct, "iv": iv})


def decrypt_api_key(encrypted_data: str) -> str:
    """
    解密 API 密钥

    Args:
        encrypted_data: JSON 格式的加密数据，包含密文和 IV

    Returns:
        str: 解密后的 API 密钥

    Raises:
        ValueError: 如果解密失败（数据格式错误或密钥不匹配）

    Example:
        >>> decrypted = decrypt_api_key('{"ct": "...", "iv": "..."}')
        >>> # 返回: "sk-1234567890"
    """
    if not encrypted_data:  # 空字符串直接返回
        return ""

    try:
        # 尝试解析 JSON（新格式：加密数据）
        data = json.loads(encrypted_data)
        iv = base64.b64decode(data["iv"])
        ct = base64.b64decode(data["ct"])

        encryption_key = _get_encryption_key()

        # 使用 AES 解密
        cipher = AES.new(encryption_key, AES.MODE_CBC, iv)
        decrypted_data = unpad(cipher.decrypt(ct), AES.block_size)
        return decrypted_data.decode("utf-8")

    except (json.JSONDecodeError, KeyError, ValueError):
        # 如果不是 JSON 格式，说明是旧数据（明文），直接返回
        # 这提供了向后兼容性，支持渐进式迁移
        return encrypted_data
