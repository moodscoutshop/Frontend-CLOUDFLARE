/**
 * SpotlightCard - Static card wrapper (spotlight effect removed)
 * @param {ReactNode} children - Card content
 * @param {string} className - Additional CSS classes
 */
const SpotlightCard = ({ children, className = '' }) => {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {children}
    </div>
  );
};

export default SpotlightCard;
