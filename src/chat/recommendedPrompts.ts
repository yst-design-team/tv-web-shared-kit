export interface RecommendedPrompt {
  key: string
  label: string
}

interface SchedulePromptOptions {
  activeTitle: string
  selectedDateLabel: string
}

interface DocumentaryPromptOptions {
  activeFilterLabel: string
  activeTitle: string
  nextFilterLabel: string
}

function stripBadgeCount(label: string) {
  return label.replace(/\s*\(\d+\)\s*$/, '').trim()
}

function shortenTitle(title: string, max = 10) {
  const normalized = title.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim()
  return normalized.length > max ? `${normalized.slice(0, max)}...` : normalized
}

export function getScheduleRecommendedPrompts({
  activeTitle,
  selectedDateLabel,
}: SchedulePromptOptions): RecommendedPrompt[] {
  const shortTitle = shortenTitle(activeTitle, 11)
  return [
    {
      key: 'schedule-prompt-0',
      label: `${selectedDateLabel}还有什么节目`,
    },
    {
      key: 'schedule-prompt-1',
      label: `推荐类似《${shortTitle}》的纪录片`,
    },
    {
      key: 'schedule-prompt-2',
      label: '回到首页',
    },
  ]
}

export function getDocumentaryRecommendedPrompts({
  activeFilterLabel,
  activeTitle,
  nextFilterLabel,
}: DocumentaryPromptOptions): RecommendedPrompt[] {
  const currentFilter = stripBadgeCount(activeFilterLabel)
  const nextFilter = stripBadgeCount(nextFilterLabel)
  const shortTitle = shortenTitle(activeTitle, 10)

  return [
    {
      key: 'doc-prompt-0',
      label: `推荐更多${currentFilter}纪录片`,
    },
    {
      key: 'doc-prompt-1',
      label: `和《${shortTitle}》类似的纪录片`,
    },
    {
      key: 'doc-prompt-2',
      label: `看看${nextFilter}纪录片`,
    },
  ]
}
