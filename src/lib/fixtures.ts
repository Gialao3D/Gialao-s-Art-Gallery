/**
 * Gallery data. Add render files to `public/img/` and list them here.
 */

export interface Artwork {
  id: string
  title: string
  image: string
  width: number
  height: number
}

export interface Patron {
  id: string
  name: string
  handle: string
  avatarInitials: string
}

export const artist = {
  name: 'Gialao',
  patreonUrl: 'https://www.patreon.com/',
  /**
   * The landing page image. Set to a file in `public/img/` (for example
   * '/img/landing.png') once the artist's own image is added. While null, the
   * landing page shows a plain dark background.
   */
  landingImage: '/img/landing.png' as string | null,
}

export const artworks: Array<Artwork> = [
  {
    id: 'render-01',
    title: 'Render 01',
    image: '/img/wolf-knight.png',
    width: 896,
    height: 1200,
  },
  {
    id: 'render-02',
    title: 'Render 02',
    image: '/img/fox-courier.png',
    width: 896,
    height: 1200,
  },
  {
    id: 'render-03',
    title: 'Render 03',
    image: '/img/dragon-library.png',
    width: 896,
    height: 1200,
  },
  {
    id: 'render-04',
    title: 'Render 04',
    image: '/img/otter-workshop.png',
    width: 1024,
    height: 1024,
  },
  {
    id: 'render-05',
    title: 'Render 05',
    image: '/img/moth-garden.png',
    width: 896,
    height: 1200,
  },
  {
    id: 'render-06',
    title: 'Render 06',
    image: '/img/tiger-studio.png',
    width: 1200,
    height: 896,
  },
]

export const getArtwork = (id: string) => artworks.find((a) => a.id === id)

/**
 * Image URL for a render. Cloudflare Pages serves files from `public/` as-is,
 * so width/quality are accepted for call-site compatibility but not applied.
 */
export const cdn = (src: string, ..._sizeHints: Array<number>) => src
