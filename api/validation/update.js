import Validator from "validator";
import isEmpty from "is-empty";

export const isFileValid = (file) => {
  const type = file.type.split("/").pop();
  const validTypes = ["jpg", "jpeg", "png", "pdf"];
  if (validTypes.indexOf(type) === -1) {
    return false;
  }
  return true;
};

export default function validateUpdateInput(data) {
    let errors = {};
    data.password = !isEmpty(data.password) ? data.password : "";
    data.password2 = !isEmpty(data.password2) ? data.password2 : "";
  
    if (!Validator.isEmpty(data.password) && !Validator.isEmpty(data.password2)) {
      if (!Validator.isLength(data.password, { min: 6, max: 30 })) {
        errors.password = "Password must be at least 6 characters";
      }
      else if (!Validator.equals(data.password, data.password2)) {
        errors.password2 = "Passwords must match";
      }
    }
  
    return {
      errors,
      isValid: isEmpty(errors),
    };
  }