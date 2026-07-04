import { zodResolver } from '@hookform/resolvers/zod';
import { FieldValues, useForm, UseFormProps } from 'react-hook-form';
import { ZodSchema } from 'zod';

export const useAppForm = <T extends FieldValues>(
  props: UseFormProps<T> & { schema: ZodSchema<T> },
) => {
  const { schema, ...rest } = props;

  return useForm<T>({
    resolver: zodResolver(schema),
    ...rest,
  });
};
