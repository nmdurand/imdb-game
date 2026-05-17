import next from "eslint-config-next";
import prettier from "eslint-config-prettier";

const config = [...(Array.isArray(next) ? next : [next]), prettier];

export default config;
