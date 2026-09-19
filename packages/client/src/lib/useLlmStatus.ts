import type { HealthResponse } from '@skillswap/shared'
import { useEffect, useState } from 'react'
import { fetchHealth } from './api'

interface LlmStatus {
  llm: HealthResponse['llm'] | null
  /** 探测是否已完成。未完成时不显示「AI 不可用」，否则首屏会闪一下错误提示 */
  checked: boolean
}

/**
 * 探测服务端的 LLM 可用性。
 * 这里用 effect 是正当的：它同步的是一个外部系统（后端状态），
 * 而不是从 props 派生本地状态。
 */
export function useLlmStatus(): LlmStatus {
  const [state, setState] = useState<LlmStatus>({ llm: null, checked: false })

  useEffect(() => {
    let alive = true
    fetchHealth().then((health) => {
      if (alive) setState({ llm: health?.llm ?? null, checked: true })
    })
    return () => {
      alive = false
    }
  }, [])

  return state
}
