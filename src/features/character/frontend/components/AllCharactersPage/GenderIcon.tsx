/**
 * 性别图标组件
 * 根据性别显示对应的图标
 */

import {
  Female as FemaleIcon,
  Male as MaleIcon,
  Transgender as TransgenderIcon,
} from '@mui/icons-material'

interface GenderIconProps {
  gender?: string
}

export default function GenderIcon({ gender }: GenderIconProps) {
  if (!gender) return null
  const lowerGender = gender.toLowerCase()
  if (lowerGender.includes('女') || lowerGender === 'female') {
    return <FemaleIcon sx={{ fontSize: 16, color: 'secondary.main' }} />
  }
  if (lowerGender.includes('男') || lowerGender === 'male') {
    return <MaleIcon sx={{ fontSize: 16, color: 'primary.main' }} />
  }
  return <TransgenderIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
}
