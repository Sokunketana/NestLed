import type { BrandLogoProps } from './BrandLogo.type'

export default function BrandLogo({ className = '', householdName, showHousehold = false, size = 'default', children, ...props }: BrandLogoProps) {
  return <span className={`brand-logo brand-logo--${size} ${className}`.trim()} {...props}>
    <span className="brand-logo__copy">
      <strong>Nestled</strong>
      {showHousehold && <small title={householdName || 'Home inventory'}>{householdName || 'Home inventory'}</small>}
      {children}
    </span>
  </span>
}
