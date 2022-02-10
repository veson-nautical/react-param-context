import React from "react";

export type StateAndSetter<T> = [T, React.Dispatch<React.SetStateAction<T>>];
