import { clsx } from 'clsx';

export const Card = ({
  children,
  className,
  padding = 'md',
  hover = false,
  ...props
}) => {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={clsx(
        'bg-white rounded-xl shadow-sm border border-secondary-200',
        paddings[padding],
        hover && 'hover:shadow-md hover:border-secondary-300 transition-all duration-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className }) => (
  <div className={clsx('border-b border-secondary-200 pb-4 mb-4', className)}>
    {children}
  </div>
);

export const CardTitle = ({ children, className }) => (
  <h3 className={clsx('text-lg font-semibold text-secondary-900', className)}>
    {children}
  </h3>
);

export const CardDescription = ({ children, className }) => (
  <p className={clsx('text-sm text-secondary-500 mt-1', className)}>
    {children}
  </p>
);

export const CardContent = ({ children, className }) => (
  <div className={className}>{children}</div>
);

export const CardFooter = ({ children, className }) => (
  <div className={clsx('border-t border-secondary-200 pt-4 mt-4', className)}>
    {children}
  </div>
);

export default Card;
