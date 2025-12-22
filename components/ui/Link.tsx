import NextLink, { LinkProps as NextLinkProps } from 'next/link'
import { AnchorHTMLAttributes, forwardRef } from 'react'

export interface LinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof NextLinkProps>,
    NextLinkProps {
  children: React.ReactNode
  className?: string
}

const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ href, as, replace, scroll, shallow, prefetch, locale, className, children, ...otherProps }, ref) => {
    return (
      <NextLink
        href={href}
        as={as}
        replace={replace}
        scroll={scroll}
        shallow={shallow}
        prefetch={prefetch}
        locale={locale}
        className={`text-green-600 hover:text-green-800 transition-colors duration-200 ${className || ''}`}
        ref={ref}
        {...otherProps}
      >
        {children}
      </NextLink>
    )
  }
)

Link.displayName = 'Link'

export { Link }

