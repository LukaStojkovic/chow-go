import { InputField } from "../fields/InputField";
import { motion } from "framer-motion";
import { FORM_FIELDS } from "../config/formFields";

export const FormFieldRenderer = ({
  fields,
  register,
  errors,
  extraProps = {},
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-4"
    >
      {fields.map((fieldName) => {
        const fieldConfig = FORM_FIELDS[fieldName];
        if (!fieldConfig) return null;

        const fieldError = errors[fieldName];

        return (
          <InputField
            key={fieldName}
            register={register(fieldName)}
            type={fieldConfig.type}
            placeholder={fieldConfig.placeholder}
            error={fieldError}
            maxLength={fieldConfig.maxLength}
          />
        );
      })}
    </motion.div>
  );
};
