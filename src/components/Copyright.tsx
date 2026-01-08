import dayjs from 'dayjs'

interface CopyrightProps {
  className?: string
  showTime?: boolean
}

export const Copyright = ({ className = 'copyright', showTime = true }: CopyrightProps) => {
  return (
    <div className={className}>
      © {dayjs().year()} 进京证排期工具 (bjjjz.vercel.app) {showTime && `| 生成时间：${dayjs().format('YYYY-MM-DD')}`}
    </div>
  )
}
