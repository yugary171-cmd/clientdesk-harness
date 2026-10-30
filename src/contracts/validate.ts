import Ajv2020 from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import contract from './openapi.json';
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
ajv.addSchema({ $id: 'contract', ...contract });
export type SchemaName = keyof typeof contract.components.schemas;
const validators = new Map<SchemaName, ReturnType<typeof ajv.compile>>();
export function validate(name: SchemaName, value: unknown) {
  let validator = validators.get(name);
  if (!validator) {
    validator = ajv.compile({ $ref: `contract#/components/schemas/${name}` });
    validators.set(name, validator);
  }
  const valid = validator(value);
  const fieldErrors: Record<string, string> = {};
  for (const error of validator.errors ?? []) {
    const field = error.instancePath.split('/').filter(Boolean)[0] ?? error.params.missingProperty;
    if (field) fieldErrors[field] = '请检查此字段的格式、长度或必填要求';
  }
  return { valid, fieldErrors };
}
