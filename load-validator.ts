type ValidationResult<T> = {
  success: boolean;
  errors?: string[];
  data?: T;
};


class load{
     static string = () => {
        return new Schema<string>((value) => {
          if (typeof value === 'string') {
            return { success: true, data: value };
          }
          return { success: false, errors: ['Expected a string'] };
        });
      };
      
      static number = () => {
        return new Schema<number>((value) => {
          if (typeof value === 'number') {
            return { success: true, data: value };
          }
          return { success: false, errors: ['Expected a number'] };
        });
      };
      
      static object = <T extends { [key: string]: Schema<any> }>(shape: T) => {
        return new Schema<{ [K in keyof T]: ReturnType<T[K]['parse']> }>((value) => {
          if (typeof value !== 'object' || value === null) {
            return { success: false, errors: ['Expected an object'] };
          }
      
          const result: any = {};
          const errors: string[] = [];
      
          for (const key in shape) {
            try {
              result[key] = shape[key].parse((value as any)[key]);
            } catch (error) {
              errors.push(`Error at key "${key}": ${error.message}`);
            }
          }
      
          if (errors.length > 0) {
            return { success: false, errors };
          }
      
          return { success: true, data: result };
        });
      };
      
      static array = <T>(itemSchema: Schema<T>) => {
        return new Schema<T[]>((value) => {
          if (!Array.isArray(value)) {
            return { success: false, errors: ['Expected an array'] };
          }
      
          const data: T[] = [];
          const errors: string[] = [];
      
          for (let i = 0; i < value.length; i++) {
            try {
              data[i] = itemSchema.parse(value[i]);
            } catch (error) {
              errors.push(`Error at index ${i}: ${error.message}`);
            }
          }
      
          if (errors.length > 0) {
            return { success: false, errors };
          }
      
          return { success: true, data };
        });
      };
}
class Schema<T> {
  constructor(private validator: (value: unknown) => ValidationResult<T>) {}

  parse(value: unknown): T {
    const result = this.validator(value);
    if (result.success) {
      return result.data as T;
    } else {
      throw new Error(`Validation failed: ${result.errors?.join(', ')}`);
    }
  }
   // Adding the optional method directly inside the class
   optional(): Schema<T | undefined> {
    return new Schema<T | undefined>((value:any):any => {
      if (value === undefined || value === null) {
        return { success: true, data: undefined };
      }
      return this.parse(value);
    });
}
}

type Infer<T> = T extends Schema<infer U> ? U : never;

const userSchema = load.object({
  name: load.string(),
  age: load.number().optional(),
  tags: load.array(load.string()),
});

type UserType = Infer<typeof userSchema>;

// UserType would be:
// {
//   name: string;
//   age?: number | undefined;
//   tags: string[];
// }

const user:UserType = {
  name: 'John Doe',
  age:23,
  tags: ['developer', 'typescript'],
};

try {
  const validatedUser = userSchema.parse(user);
  console.log('Validated User:', validatedUser);
} catch (error) {
  console.error(error.message);
}
