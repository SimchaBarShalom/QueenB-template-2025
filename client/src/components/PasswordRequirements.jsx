import React, { Fragment } from "react";
import { Stack, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { PASSWORD_RULES, getPasswordChecks } from "../utils/passwordValidation";
import { useLanguage } from "../i18n/LanguageContext";

function PasswordRequirements({ password }) {
  const { t } = useLanguage();
  const checks = getPasswordChecks(password);

  return (
    <Stack direction="row" flexWrap="wrap" alignItems="center" rowGap={0.5} columnGap={1}>
      {PASSWORD_RULES.map((rule, index) => {
        const satisfied = checks[rule.key];

        return (
          <Fragment key={rule.key}>
            {index > 0 && (
              <Typography component="span" variant="caption" sx={{ color: "text.disabled" }}>
                |
              </Typography>
            )}
            <Stack direction="row" spacing={0.4} alignItems="center">
              {satisfied ? (
                <CheckCircleIcon sx={{ fontSize: 15, color: "success.main" }} />
              ) : (
                <RadioButtonUncheckedIcon sx={{ fontSize: 15, color: "text.disabled" }} />
              )}
              <Typography
                variant="caption"
                sx={{ color: satisfied ? "success.main" : "text.secondary", fontWeight: satisfied ? 700 : 400 }}
              >
                {t(`auth.passwordRules.${rule.key}`)}
              </Typography>
            </Stack>
          </Fragment>
        );
      })}
    </Stack>
  );
}

export default PasswordRequirements;
