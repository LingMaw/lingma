#!/usr/bin/env python3
"""
角色模板种子数据脚本
为系统添加常用的角色模板
"""

import asyncio
import sys
from pathlib import Path

# 添加项目根目录到 Python 路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from tortoise import Tortoise

from src.backend.config.database import TORTOISE_ORM
from src.features.character.backend.models import CharacterTemplate

# 预定义的角色模板
TEMPLATES = [
    {
        "name": "热血主角",
        "description": "充满正义感和行动力的热血主角模板",
        "category": "主角",
        "basic_info": {
            "age": "16-25",
            "gender": "不限",
            "appearance": "阳光开朗的外表",
        },
        "background": {
            "origin": "平凡或特殊的出身",
            "motivation": "守护重要的人或实现梦想",
        },
        "personality": {
            "traits": ["勇敢", "正义", "热情", "坚持不懈"],
            "strengths": ["强大的意志力", "善于激励他人"],
            "weaknesses": ["有时过于冲动", "容易被挑衅"],
        },
        "abilities": {
            "special": "随剧情成长的特殊能力",
            "skills": ["战斗技巧", "领导力"],
        },
    },
    {
        "name": "智谋军师",
        "description": "善于谋略和布局的智者角色",
        "category": "配角",
        "basic_info": {
            "age": "25-40",
            "gender": "不限",
            "appearance": "沉稳睿智的气质",
        },
        "background": {
            "education": "深厚的学识背景",
            "experience": "丰富的人生阅历",
        },
        "personality": {
            "traits": ["冷静", "理性", "深谋远虑", "洞察力强"],
            "strengths": ["卓越的分析能力", "战略思维"],
            "weaknesses": ["有时过于谨慎", "缺乏行动力"],
        },
        "abilities": {
            "special": "预知或推理能力",
            "skills": ["策略制定", "信息分析", "谈判技巧"],
        },
    },
    {
        "name": "高冷天才",
        "description": "才华横溢但性格孤僻的天才角色",
        "category": "主角",
        "basic_info": {
            "age": "18-30",
            "gender": "不限",
            "appearance": "精致冷淡的外貌",
        },
        "background": {
            "talent": "与生俱来的天赋",
            "isolation": "因天赋而被孤立的经历",
        },
        "personality": {
            "traits": ["高傲", "独立", "完美主义", "不善交际"],
            "strengths": ["超群的智力", "专注力极强"],
            "weaknesses": ["情感表达困难", "不易信任他人"],
        },
        "abilities": {
            "special": "某领域的极致天赋",
            "skills": ["专业技能精通", "快速学习能力"],
        },
    },
    {
        "name": "反派BOSS",
        "description": "强大且有深层动机的反派角色",
        "category": "反派",
        "basic_info": {
            "age": "30-50",
            "gender": "不限",
            "appearance": "威严或魅力十足的气场",
        },
        "background": {
            "past": "悲惨或扭曲的过去",
            "motivation": "值得理解的终极目标",
        },
        "personality": {
            "traits": ["野心勃勃", "冷酷", "有魅力", "执着"],
            "strengths": ["强大的实力", "领导力", "策略思维"],
            "weaknesses": ["过度自信", "对某些事物的执念"],
        },
        "abilities": {
            "special": "压倒性的强大能力",
            "skills": ["掌控组织", "暗中布局", "战斗力顶尖"],
        },
    },
    {
        "name": "治愈系伙伴",
        "description": "温柔善良、能治愈他人心灵的角色",
        "category": "配角",
        "basic_info": {
            "age": "15-25",
            "gender": "不限",
            "appearance": "温柔亲和的气质",
        },
        "background": {
            "family": "温暖的家庭背景",
            "experience": "经历过痛苦而更懂得关怀",
        },
        "personality": {
            "traits": ["温柔", "善良", "善解人意", "坚韧"],
            "strengths": ["共情能力强", "能安抚他人"],
            "weaknesses": ["容易为他人牺牲自己", "缺乏自我保护"],
        },
        "abilities": {
            "special": "治愈或精神支持能力",
            "skills": ["医疗", "心理疏导", "后勤支援"],
        },
    },
    {
        "name": "神秘导师",
        "description": "拥有深厚背景的神秘引导者",
        "category": "配角",
        "basic_info": {
            "age": "40-60",
            "gender": "不限",
            "appearance": "沧桑却有力量感",
        },
        "background": {
            "past": "传奇的过去经历",
            "secrets": "隐藏的身份或秘密",
        },
        "personality": {
            "traits": ["神秘", "睿智", "严厉", "护短"],
            "strengths": ["丰富的经验", "强大的实力"],
            "weaknesses": ["不愿回忆过去", "有时过于保护弟子"],
        },
        "abilities": {
            "special": "已达巅峰的某种能力",
            "skills": ["传授技艺", "关键时刻的指引"],
        },
    },
    {
        "name": "傲娇竞争者",
        "description": "表面高傲实则内心柔软的竞争对手",
        "category": "配角",
        "basic_info": {
            "age": "16-25",
            "gender": "不限",
            "appearance": "精致且自信的外表",
        },
        "background": {
            "family": "优越的家庭背景",
            "pride": "自尊心极强的成长环境",
        },
        "personality": {
            "traits": ["傲娇", "好胜", "不服输", "内心温柔"],
            "strengths": ["优秀的能力", "强烈的上进心"],
            "weaknesses": ["口是心非", "不善表达真实感受"],
        },
        "abilities": {
            "special": "与主角势均力敌的能力",
            "skills": ["全能型技能", "快速成长"],
        },
    },
    {
        "name": "搞笑担当",
        "description": "活跃气氛、带来欢乐的开心果角色",
        "category": "配角",
        "basic_info": {
            "age": "18-30",
            "gender": "不限",
            "appearance": "亲切友善的面容",
        },
        "background": {
            "origin": "乐观的生活态度",
            "motivation": "希望身边的人都开心",
        },
        "personality": {
            "traits": ["乐观", "幽默", "外向", "善良"],
            "strengths": ["活跃气氛", "化解尴尬", "鼓舞士气"],
            "weaknesses": ["严肃时不被重视", "有时掩饰自己的痛苦"],
        },
        "abilities": {
            "special": "意外的实用技能",
            "skills": ["社交能力", "情报搜集", "后勤支援"],
        },
    },
]


async def seed_templates():
    """添加种子模板数据"""
    try:
        # 初始化数据库连接
        await Tortoise.init(config=TORTOISE_ORM)

        # 检查现有模板数量
        existing_count = await CharacterTemplate.all().count()
        print(f"当前模板数量: {existing_count}")

        if existing_count > 0:
            confirm = input("数据库中已有模板数据，是否继续添加？(y/N): ")
            if confirm.lower() != "y":
                print("已取消操作")
                return

        # 创建模板
        created_count = 0
        for template_data in TEMPLATES:
            # 检查是否已存在同名模板
            existing = await CharacterTemplate.filter(
                name=template_data["name"],
            ).first()
            if existing:
                print(f"跳过已存在的模板: {template_data['name']}")
                continue

            await CharacterTemplate.create(**template_data)
            print(f"✓ 创建模板: {template_data['name']}")
            created_count += 1

        print(f"\n成功创建 {created_count} 个模板")
        print(f"总模板数: {await CharacterTemplate.all().count()}")

    except Exception as e:
        print(f"错误: {e}")
        import traceback

        traceback.print_exc()
    finally:
        await Tortoise.close_connections()


if __name__ == "__main__":
    asyncio.run(seed_templates())
