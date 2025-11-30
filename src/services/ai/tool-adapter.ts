import { z } from 'zod';

type JSONSchema = {
  type: string;
  properties?: Record<string, any>;
  required?: string[];
  additionalProperties?: boolean;
  description?: string;
  [key: string]: any;
};

function jsonSchemaToZod(schema: JSONSchema): z.ZodTypeAny {
  if (!schema || typeof schema !== 'object') {
    return z.any();
  }

  const { type, properties, required = [], description } = schema;

  if (type === 'object' && properties) {
    const shape: Record<string, z.ZodTypeAny> = {};
    
    for (const [key, prop] of Object.entries(properties)) {
      const isRequired = required.includes(key);
      let zodType = jsonSchemaPropertyToZod(prop);
      
      if (prop.description) {
        zodType = zodType.describe(prop.description);
      }
      
      shape[key] = isRequired ? zodType : zodType.optional();
    }
    
    let zodObject = z.object(shape);
    
    if (description) {
      zodObject = zodObject.describe(description);
    }
    
    if (schema.additionalProperties === false) {
      zodObject = zodObject.strict();
    }
    
    return zodObject;
  }

  if (type === 'string') {
    let zodType = z.string();
    if (description) zodType = zodType.describe(description);
    return zodType;
  }

  if (type === 'number' || type === 'integer') {
    let zodType = z.number();
    if (description) zodType = zodType.describe(description);
    return zodType;
  }

  if (type === 'boolean') {
    let zodType = z.boolean();
    if (description) zodType = zodType.describe(description);
    return zodType;
  }

  if (type === 'array') {
    const items = schema.items ? jsonSchemaPropertyToZod(schema.items) : z.any();
    let zodType = z.array(items);
    if (description) zodType = zodType.describe(description);
    return zodType;
  }

  return z.any();
}

function jsonSchemaPropertyToZod(prop: any): z.ZodTypeAny {
  if (!prop || typeof prop !== 'object') {
    return z.any();
  }

  const { type, description, enum: enumValues } = prop;

  if (enumValues && Array.isArray(enumValues)) {
    const zodEnum = z.enum(enumValues as [string, ...string[]]);
    return description ? zodEnum.describe(description) : zodEnum;
  }

  if (type === 'string') {
    let zodType = z.string();
    if (description) zodType = zodType.describe(description);
    return zodType;
  }

  if (type === 'number' || type === 'integer') {
    let zodType = z.number();
    if (description) zodType = zodType.describe(description);
    return zodType;
  }

  if (type === 'boolean') {
    let zodType = z.boolean();
    if (description) zodType = zodType.describe(description);
    return zodType;
  }

  if (type === 'array') {
    const items = prop.items ? jsonSchemaPropertyToZod(prop.items) : z.any();
    let zodType = z.array(items);
    if (description) zodType = zodType.describe(description);
    return zodType;
  }

  if (type === 'object' && prop.properties) {
    return jsonSchemaToZod(prop);
  }

  return z.any();
}

export function convertJSONSchemaToZod(schema: JSONSchema): z.ZodTypeAny {
  return jsonSchemaToZod(schema);
}

