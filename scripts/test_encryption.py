#!/usr/bin/env python3
"""
测试 API 密钥加密/解密功能

使用方法：
    cd /home/devbox/project/lingma
    uv run python scripts/test_encryption.py
"""

import sys
from pathlib import Path

# 添加项目根目录到 Python 路径
project_root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(project_root))

from src.backend.core.security import decrypt_api_key, encrypt_api_key


def test_encryption():
    """测试加密和解密功能"""
    print("=" * 60)
    print("API 密钥加密/解密功能测试")
    print("=" * 60)
    
    # 测试用例
    test_cases = [
        "sk-1234567890abcdef",
        "my-secret-api-key-12345",
        "test-key-with-special-chars!@#$%",
        "",  # 空字符串
    ]
    
    all_passed = True
    
    for i, original_key in enumerate(test_cases, 1):
        print(f"\n测试用例 {i}:")
        print(f"  原始密钥: '{original_key}'")
        
        try:
            # 加密
            encrypted = encrypt_api_key(original_key)
            print(f"  加密结果: {encrypted[:60]}..." if len(encrypted) > 60 else f"  加密结果: {encrypted}")
            
            # 解密
            decrypted = decrypt_api_key(encrypted)
            print(f"  解密结果: '{decrypted}'")
            
            # 验证
            if decrypted == original_key:
                print("  ✓ 测试通过")
            else:
                print("  ✗ 测试失败！解密结果与原始值不匹配")
                all_passed = False
                
        except Exception as e:
            print(f"  ✗ 测试失败！错误: {e}")
            all_passed = False
    
    # 测试向后兼容性（明文数据）
    print(f"\n测试用例 {len(test_cases) + 1}: 向后兼容性（明文输入）")
    plaintext = "old-plaintext-key"
    print(f"  输入（明文）: '{plaintext}'")
    
    try:
        # 直接解密明文应该返回原值
        decrypted = decrypt_api_key(plaintext)
        print(f"  解密结果: '{decrypted}'")
        
        if decrypted == plaintext:
            print("  ✓ 向后兼容测试通过")
        else:
            print("  ✗ 向后兼容测试失败！")
            all_passed = False
            
    except Exception as e:
        print(f"  ✗ 向后兼容测试失败！错误: {e}")
        all_passed = False
    
    # 总结
    print("\n" + "=" * 60)
    if all_passed:
        print("✓ 所有测试通过！")
        print("=" * 60)
        return 0
    print("✗ 部分测试失败")
    print("=" * 60)
    return 1


if __name__ == "__main__":
    sys.exit(test_encryption())
