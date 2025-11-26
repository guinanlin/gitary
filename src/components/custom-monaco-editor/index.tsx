// Import curated Monaco API + selected language contributions
import { monaco } from "@/monaco/customMonaco";
import React from "react";
import { useColorMode } from "@chakra-ui/react";

type KeyBinding = {
  key: number;
  action: () => void;
};

type Props = {
  value: string;
  language: string;
  onChange?: (value: string) => void;
  keyBindings?: KeyBinding[];
  theme?: string;
  options?: monaco.editor.IStandaloneEditorConstructionOptions;
  onMount?: () => void;
};

export const CustomMonacoEditor = (props: Props) => {
  const { colorMode } = useColorMode();
  const {
    theme: propTheme,
    options: monacoOptions,
    onMount,
    value,
    language,
    keyBindings,
    onChange,
  } = props;
  const editorRef = React.useRef<monaco.editor.IStandaloneCodeEditor | null>(
    null
  );
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  
  const isUserEditingRef = React.useRef(false);
  const onChangeRef = React.useRef(onChange);
  const keyBindingsRef = React.useRef(keyBindings);
  const monacoOptionsRef = React.useRef(monacoOptions);
  const onMountRef = React.useRef(onMount);

  React.useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  React.useEffect(() => {
    keyBindingsRef.current = keyBindings;
  }, [keyBindings]);

  React.useEffect(() => {
    monacoOptionsRef.current = monacoOptions;
  }, [monacoOptions]);

  React.useEffect(() => {
    onMountRef.current = onMount;
  }, [onMount]);

  React.useEffect(() => {
    if (!containerRef.current) return;

    const currentTheme = propTheme || (colorMode === "dark" ? "vs-dark" : "vs");
    
    editorRef.current = monaco.editor.create(containerRef.current, {
      value,
      language,
      theme: currentTheme,
      ...monacoOptionsRef.current,
    });

    onMountRef.current?.();

    const changeModelContentSubscription =
      editorRef.current.onDidChangeModelContent(() => {
        isUserEditingRef.current = true;
        onChangeRef.current?.(editorRef.current?.getValue() ?? "");
        setTimeout(() => {
          isUserEditingRef.current = false;
        }, 0);
      });

    keyBindingsRef.current?.forEach((binding) => {
      editorRef.current?.addCommand(binding.key, binding.action);
    });

    const resizeObserver = new ResizeObserver(() => {
      editorRef.current?.layout();
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      changeModelContentSubscription.dispose();
      editorRef.current?.dispose();
    };
  }, [language, propTheme, colorMode]);

  React.useEffect(() => {
    if (editorRef.current && !isUserEditingRef.current) {
      const model = editorRef.current.getModel();
      const position = editorRef.current.getPosition();
      const currentValue = editorRef.current.getValue();

      if (currentValue !== value) {
        editorRef.current.setValue(value);

        if (model && position) {
          editorRef.current.setPosition(position);
          editorRef.current.revealPosition(position);
        }
      }
    }
  }, [value]);

  React.useEffect(() => {
    if (editorRef.current && !propTheme) {
      const newTheme = colorMode === "dark" ? "vs-dark" : "vs";
      monaco.editor.setTheme(newTheme);
    }
  }, [colorMode, propTheme]);

  return <div ref={containerRef} style={{ height: "100%" }} />;
};

export const MonacoKeyMod = monaco.KeyMod;
export const MonacoKeyCode = monaco.KeyCode;
