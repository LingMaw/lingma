"""
认证API路由
提供登录、登出、获取用户信息等接口
"""

from fastapi import APIRouter, Request

from src.backend.core.dependencies import CurrentUserId
from src.backend.core.exceptions import AuthenticationError, ResourceAlreadyExistsError
from src.backend.core.logger import logger
from src.backend.core.security import (
    create_access_token,
    get_password_hash,
    verify_password,
)

from .models import DEFAULT_USER_SETTINGS, User, UserSetting
from .schemas import LoginRequest, LoginResponse, RegisterRequest, UserResponse

router = APIRouter()


@router.post("/login", response_model=LoginResponse)
async def login(data: LoginRequest):
    """
    用户登录

    Args:
        data: 登录请求数据（用户名、密码）

    Returns:
        LoginResponse: 包含访问令牌和用户信息

    Raises:
        AuthenticationError: 用户名或密码错误
    """
    # 查询用户
    user = await User.filter(username=data.username, is_active=True).first()

    if not user:
        logger.warning(f"登录失败：用户不存在 - {data.username}")
        raise AuthenticationError("用户名或密码错误")

    # 验证密码
    if not verify_password(data.password, user.hashed_password):
        logger.warning(f"登录失败：密码错误 - {data.username}")
        raise AuthenticationError("用户名或密码错误")

    # 创建token
    token = create_access_token(data={"sub": str(user.id)})

    logger.info(f"用户登录成功: {user.username} (ID: {user.id})")

    # 返回响应
    return LoginResponse(
        access_token=token,
        user=UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            nickname=user.nickname or user.username,
            role=user.role,
            avatar=user.avatar,
            created_at=user.created_at,
        ),
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user(user_id: CurrentUserId):
    """
    获取当前用户信息

    Args:
        user_id: 当前用户ID（从JWT中解析）

    Returns:
        UserResponse: 用户信息

    Raises:
        AuthenticationError: 用户不存在或已被禁用
    """
    user = await User.filter(id=user_id, is_active=True).first()

    if not user:
        logger.warning(f"获取用户信息失败：用户不存在或已禁用 - ID: {user_id}")
        raise AuthenticationError("用户不存在或已被禁用")

    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        nickname=user.nickname or user.username,
        role=user.role,
        avatar=user.avatar,
        created_at=user.created_at,
    )


@router.get("/{user_id}/avatar")
async def get_user_avatar(user_id: int):
    """
    获取指定用户的头像URL

    Args:
        user_id: 用户ID

    Returns:
        dict: 包含用户头像URL的字典

    Raises:
        AuthenticationError: 用户不存在或已被禁用
    """
    user = await User.filter(id=user_id, is_active=True).first()

    if not user:
        logger.warning(f"获取用户头像失败：用户不存在或已禁用 - ID: {user_id}")
        raise AuthenticationError("用户不存在或已被禁用")

    return {"avatar": user.avatar}


@router.post("/logout")
async def logout():
    """
    用户登出

    JWT是无状态的，客户端删除token即可
    如需黑名单机制，可以在这里实现
    """
    return {"success": True, "message": "登出成功"}


@router.post("/register", response_model=UserResponse, status_code=201)
async def register(data: RegisterRequest):
    """
    用户注册

    Args:
        data: 注册数据（用户名、密码、可选邮箱）

    Returns:
        UserResponse: 新创建的用户信息

    Raises:
        ResourceAlreadyExistsError: 用户名已存在
    """
    # 检查用户是否已存在
    existing_user = await User.filter(username=data.username).first()
    if existing_user:
        logger.warning(f"注册失败：用户名已存在 - {data.username}")
        raise ResourceAlreadyExistsError("用户", "用户名已存在")

    # 创建用户
    hashed_password = get_password_hash(data.password)
    user = await User.create(
        username=data.username,
        hashed_password=hashed_password,
        email=data.email or f"{data.username}@example.com",  # 如果未提供邮箱，则生成临时邮箱
        nickname=data.username,
        role="user",
    )

    # 为新用户创建默认设置
    for key, value in DEFAULT_USER_SETTINGS.items():
        await UserSetting.create(user=user, key=key, value=value)

    logger.info(f"新用户注册成功: {user.username} (ID: {user.id})")

    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        nickname=user.nickname or user.username,
        role=user.role,
        avatar=user.avatar,
        created_at=user.created_at,
    )


@router.get("/settings", response_model=dict[str, str])
async def get_user_settings(user_id: CurrentUserId):
    """
    获取当前用户的所有设置

    Args:
        user_id: 当前用户ID（从JWT中解析）

    Returns:
        dict[str, str]: 用户设置字典
    """
    settings = await UserSetting.filter(user_id=user_id).all()
    return {setting.key: setting.value for setting in settings}


@router.get("/settings/{key}", response_model=str)
async def get_user_setting(key: str, user_id: CurrentUserId):
    """
    获取当前用户的特定设置

    Args:
        key: 设置键
        user_id: 当前用户ID（从JWT中解析）

    Returns:
        str: 用户设置值

    Raises:
        AuthenticationError: 设置不存在
    """
    setting = await UserSetting.filter(user_id=user_id, key=key).first()
    if not setting:
        # 如果设置不存在，返回默认值
        if key in DEFAULT_USER_SETTINGS:
            return DEFAULT_USER_SETTINGS[key]
        raise AuthenticationError(f"设置 {key} 不存在")
    
    return setting.value


@router.post("/settings/{key}")
async def update_user_setting(key: str, request: Request, user_id: CurrentUserId):
    """
    更新或创建当前用户的特定设置

    Args:
        key: 设置键
        request: HTTP请求对象，包含设置值
        user_id: 当前用户ID（从JWT中解析）

    Returns:
        dict: 更新结果
    """
    # 解析请求体中的JSON数据
    try:
        body = await request.json()
        value = body.get("value")
        if value is None:
            from fastapi import HTTPException
            raise HTTPException(status_code=422, detail="缺少设置值 'value'")
    except ValueError as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=422, detail="请求体必须是有效的JSON格式") from e
    
    # 验证设置键是否有效
    if key not in DEFAULT_USER_SETTINGS:
        raise AuthenticationError(f"无效的设置项: {key}")
        
    await UserSetting.update_or_create(
        defaults={"value": value},
        user_id=user_id,
        key=key,
    )
    
    logger.info(f"用户设置已更新: {key} = {value} (用户ID: {user_id})")
    return {"success": True, "message": f"设置 {key} 已更新"}


@router.post("/settings/reset", response_model=dict[str, str])
async def reset_user_settings(user_id: CurrentUserId):
    """
    重置当前用户的所有设置为默认值

    Args:
        user_id: 当前用户ID（从JWT中解析）

    Returns:
        dict[str, str]: 重置后的用户设置字典
    """
    for key, value in DEFAULT_USER_SETTINGS.items():
        await UserSetting.update_or_create(
            defaults={"value": value},
            user_id=user_id,
            key=key,
        )
    
    logger.info(f"用户设置已重置 (用户ID: {user_id})")
    return DEFAULT_USER_SETTINGS


@router.put("/profile", response_model=UserResponse)
async def update_user_profile(data: dict, user_id: CurrentUserId):
    """
    更新当前用户的基本信息（昵称等）

    Args:
        data: 包含要更新的用户信息
        user_id: 当前用户ID（从JWT中解析）

    Returns:
        UserResponse: 更新后的用户信息
    """
    user = await User.get(id=user_id)
    
    # 更新用户信息
    if "nickname" in data:
        user.nickname = data["nickname"]
    
    if "email" in data:
        user.email = data["email"]
        
    if "avatar" in data:
        user.avatar = data["avatar"]
    
    await user.save()
    
    logger.info(f"用户资料已更新: {user.username} (ID: {user.id})")
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        nickname=user.nickname or user.username,
        role=user.role,
        avatar=user.avatar,
        created_at=user.created_at,
    )


@router.put("/password")
async def update_user_password(data: dict, user_id: CurrentUserId):
    """
    更新当前用户密码

    Args:
        data: 包含旧密码和新密码
        user_id: 当前用户ID（从JWT中解析）

    Returns:
        dict: 更新结果
    """
    user = await User.get(id=user_id)
    
    # 验证旧密码
    old_password = data.get("old_password")
    new_password = data.get("new_password")
    
    if not old_password or not new_password:
        from fastapi import HTTPException
        raise HTTPException(status_code=422, detail="旧密码和新密码都必须提供")
    
    if not verify_password(old_password, user.hashed_password):
        raise AuthenticationError("旧密码不正确")
    
    if len(new_password) < 6:
        raise AuthenticationError("新密码长度至少为6位")
    
    # 更新密码
    user.hashed_password = get_password_hash(new_password)
    await user.save()
    
    logger.info(f"用户密码已更新: {user.username} (ID: {user.id})")
    return {"success": True, "message": "密码更新成功"}
