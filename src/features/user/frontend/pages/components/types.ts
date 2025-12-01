// 个人信息表单类型
export interface ProfileFormData {
    nickname: string
    email: string
    avatar: string
}

// AI配置类型
export interface AiSettingsData {
    api_key: string
    api_base: string
    api_model: string
    api_max_tokens: string
    auto_save: string
}

// 密码表单类型
export interface PasswordFormData {
    oldPassword: string
    newPassword: string
    confirmPassword: string
}

// 密码可见性类型
export interface PasswordVisibility {
    old: boolean
    new: boolean
    confirm: boolean
}
