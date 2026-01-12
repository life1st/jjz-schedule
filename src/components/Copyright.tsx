import dayjs from 'dayjs'

interface CopyrightProps {
  className?: string
  showTime?: boolean
  style?: React.CSSProperties
}

export const Copyright = ({ className = 'copyright', showTime = true, style = {} }: CopyrightProps) => {
  return (
    <div className={className} style={style}>
      © {dayjs().year()} 进京证排期工具 (bjjjz.vercel.app) {showTime && `| 生成时间：${dayjs().format('YYYY-MM-DD')}`}
    </div>
  )
}
