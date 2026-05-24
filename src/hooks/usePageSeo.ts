import { useEffect } from 'react'

export const SITE_URL = 'https://citycalzadourbano.pages.dev'

export type PageSeoOptions = {
  title: string
  description: string
  path?: string
  robots?: string
}

function setMetaByName(name: string, content: string) {
  let meta = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)

  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('name', name)
    document.head.appendChild(meta)
  }

  meta.setAttribute('content', content)
}

function setMetaByProperty(property: string, content: string) {
  let meta = document.head.querySelector<HTMLMetaElement>(
    `meta[property="${property}"]`,
  )

  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('property', property)
    document.head.appendChild(meta)
  }

  meta.setAttribute('content', content)
}

function setCanonical(url: string) {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')

  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }

  link.setAttribute('href', url)
}

function buildCanonicalUrl(path = '/') {
  const pathWithLeadingSlash = path.startsWith('/') ? path : `/${path}`
  const normalizedPath =
    pathWithLeadingSlash === '/' ? '/' : pathWithLeadingSlash.replace(/\/+$/, '')

  return `${SITE_URL}${normalizedPath}`
}

export function usePageSeo({
  title,
  description,
  path = '/',
  robots = 'index, follow',
}: PageSeoOptions) {
  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    const canonicalUrl = buildCanonicalUrl(path)

    document.title = title
    setMetaByName('description', description)
    setMetaByName('robots', robots)
    setCanonical(canonicalUrl)
    setMetaByProperty('og:title', title)
    setMetaByProperty('og:description', description)
    setMetaByProperty('og:url', canonicalUrl)
    setMetaByName('twitter:title', title)
    setMetaByName('twitter:description', description)
  }, [description, path, robots, title])
}
