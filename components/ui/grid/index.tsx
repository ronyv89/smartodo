import React, {
  useEffect,
  useState,
  createContext,
  useContext,
  useMemo,
  forwardRef,
} from "react";
import type { VariantProps } from "@gluestack-ui/nativewind-utils";
import { View, Dimensions, Platform, ViewProps } from "react-native";
import { gridStyle, gridItemStyle } from "./styles";
import { cssInterop } from "nativewind";
import {
  useBreakpointValue,
  getBreakPointValue,
} from "@/components/ui/utils/use-break-point-value";

// Define the breakpoints type locally since it's not exported from use-break-point-value
type breakpoints = "default" | "sm" | "md" | "lg" | "xl" | "2xl";

const { width: DEVICE_WIDTH } = Dimensions.get("window");

interface GridContextType {
  calculatedWidth: number | null;
  numColumns: number;
  itemsPerRow: Record<number, number[]>;
  flexDirection?: "row" | "column" | "row-reverse" | "column-reverse";
  gap?: number;
  columnGap?: number;
}

const GridContext = createContext<GridContextType>({
  calculatedWidth: null,
  numColumns: 12,
  itemsPerRow: {} as Record<number, number[]>,
  flexDirection: "row",
  gap: 0,
  columnGap: 0
});

function arrangeChildrenIntoRows({
  childrenArray,
  colSpanArr,
  numColumns,
}: {
  childrenArray: React.ReactElement[];
  colSpanArr: number[];
  numColumns: number;
}): Record<number, number[]> {
  let currentRow = 1;
  let currentRowTotalColSpan = 0;

  // store how many items in each row
  const rowItemsCount: {
    [key: number]: number[];
  } = {};

  for (let i = 0; i < childrenArray.length; i++) {
    const colSpan = colSpanArr[i];

    // if current row is full, go to next row
    if (currentRowTotalColSpan + colSpan > numColumns) {
      currentRow++;
      currentRowTotalColSpan = colSpan;
    } else {
      // if current row is not full, add colSpan to current row
      currentRowTotalColSpan += colSpan;
    }

    rowItemsCount[currentRow] = rowItemsCount[currentRow]
      ? [...rowItemsCount[currentRow], i]
      : [i];
  }

  return rowItemsCount;
}

function generateResponsiveNumColumns({ gridClass }: { gridClass: string }): Partial<Record<breakpoints, number>> {
  const gridClassNamePattern = /\b(?:\w+:)?grid-cols-?\d+\b/g;
  const numColumns = gridClass?.match(gridClassNamePattern);

  if (!numColumns) {
    return { default: 12 };
  }

  const regex = /^(?:(\w+):)?grid-cols-?(\d+)$/;
  const result: Record<string, number> = {};

  numColumns.forEach((classname) => {
    const match = classname.match(regex);
    if (match) {
      const prefix = match[1] || "default";
      const value = parseInt(match[2], 10);
      result[prefix] = value;
    }
  });

  return result;
}

function generateResponsiveColSpans({
  gridItemClassName,
}: {
  gridItemClassName: string;
}): Partial<Record<breakpoints, number>> {
  const gridClassNamePattern = /\b(?:\w+:)?col-span-?\d+\b/g;

  const colSpan: RegExpMatchArray | null = gridItemClassName?.match(gridClassNamePattern);

  if (!colSpan) {
    return { default: 1 };
  }

  const regex = /^(?:(\w+):)?col-span-?(\d+)$/;
  const result: any = {};

  colSpan.forEach((classname: string) => {
    const match = classname.match(regex);
    if (match) {
      const prefix = match[1] || "default";
      const value = parseInt(match[2], 10);
      result[prefix] = value;
    }
  });

  return result;
}

type IGridProps = ViewProps &
  VariantProps<typeof gridStyle> & {
    gap?: number;
    rowGap?: number;
    columnGap?: number;
    flexDirection?: "row" | "column" | "row-reverse" | "column-reverse";
    padding?: number;
    paddingLeft?: number;
    paddingRight?: number;
    paddingStart?: number;
    paddingEnd?: number;
    borderWidth?: number;
    borderLeftWidth?: number;
    borderRightWidth?: number;
    _extra: {
      className: string;
    };
  };

const Grid = forwardRef<React.ComponentRef<typeof View>, IGridProps>(
  function Grid({ className, _extra, children, ...props }, ref) {
    const [calculatedWidth, setCalculatedWidth] = useState<number | null>(null);

    const gridClass = _extra?.className;
    const obj = generateResponsiveNumColumns({ gridClass });
    const responsiveNumColumns = useBreakpointValue(obj as Partial<Record<breakpoints, number>>) ?? 12;

    const itemsPerRow = useMemo(() => {
      if (!children) return {} as Record<number, number[]>;
      
      // get the colSpan of each child
      const colSpanArr = React.Children.map(children, (child) => {
        if (!React.isValidElement(child) || !child.props) return 1;
        // Use type assertion for _extra property
        const props = child.props as { _extra?: { className: string } };
        const gridItemClassName = props._extra?.className || '';

        const colSpan2 = getBreakPointValue(
          generateResponsiveColSpans({ gridItemClassName }),
          DEVICE_WIDTH
        );
        const colSpan = colSpan2 ? colSpan2 : 1;

        if (colSpan > responsiveNumColumns) {
          return responsiveNumColumns;
        }

        return colSpan;
      });

      // Ensure children is not undefined before converting to array
      const childrenArray = React.Children.toArray(children).filter(React.isValidElement) as React.ReactElement[];

      const rowItemsCount = arrangeChildrenIntoRows({
        childrenArray,
        colSpanArr: colSpanArr || [],
        numColumns: responsiveNumColumns,
      });

      return rowItemsCount;
    }, [responsiveNumColumns, children]);

    const childrenWithProps = children ? React.Children.map(children, (child, index) => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child, { key: index });
      }

      return child;
    }) : null;

    const gridClassMerged = `${Platform.select({
      web: gridClass ?? "",
    })}`;

    const contextValue = useMemo(() => {
      return {
        calculatedWidth,
        numColumns: responsiveNumColumns,
        itemsPerRow,
        flexDirection: props?.flexDirection || "row",
        gap: props?.gap || 0,
        columnGap: props?.columnGap || 0,
      };
    }, [calculatedWidth, itemsPerRow, responsiveNumColumns, props]);

    const borderLeftWidth = props?.borderLeftWidth || props?.borderWidth || 0;
    const borderRightWidth = props?.borderRightWidth || props?.borderWidth || 0;
    const borderWidthToSubtract = borderLeftWidth + borderRightWidth;

    return (
      <GridContext.Provider value={contextValue}>
        <View
          ref={ref}
          className={gridStyle({
            class: className + " " + gridClassMerged,
          })}
          onLayout={(event) => {
            const paddingLeftToSubtract =
              props?.paddingStart || props?.paddingLeft || props?.padding || 0;

            const paddingRightToSubtract =
              props?.paddingEnd || props?.paddingRight || props?.padding || 0;

            const gridWidth =
              event.nativeEvent.layout.width -
              paddingLeftToSubtract -
              paddingRightToSubtract -
              borderWidthToSubtract;

            setCalculatedWidth(gridWidth);
          }}
          {...props}
        >
          {calculatedWidth && childrenWithProps}
        </View>
      </GridContext.Provider>
    );
  }
);

cssInterop(Grid, {
  className: {
    target: "style",
    nativeStyleToProp: {
      gap: "gap",
      rowGap: "rowGap",
      columnGap: "columnGap",
      flexDirection: "flexDirection",
      padding: "padding",
      paddingLeft: "paddingLeft",
      paddingRight: "paddingRight",
      paddingStart: "paddingStart",
      paddingEnd: "paddingEnd",
      borderWidth: "borderWidth",
      borderLeftWidth: "borderLeftWidth",
      borderRightWidth: "borderRightWidth",
    },
  },
});

type IGridItemProps = ViewProps &
  VariantProps<typeof gridItemStyle> & {
    index?: number;
    _extra: {
      className: string;
    };
  };

const GridItem = forwardRef<React.ComponentRef<typeof View>, IGridItemProps>(
  function GridItem({ className, _extra, ...props }, ref) {
    const [flexBasisValue, setFlexBasisValue] = useState<
      number | string | null
    >("auto");

    const {
      calculatedWidth,
      numColumns,
      itemsPerRow,
      flexDirection,
      gap,
      columnGap,
    } = useContext(GridContext);

    // Use type assertion for _extra property
    const extraProps = _extra as { className: string } | undefined;
    const gridItemClass = extraProps?.className || '';
    const colSpanObj = generateResponsiveColSpans({ gridItemClassName: gridItemClass });
    const responsiveColSpan = useBreakpointValue(colSpanObj) ?? 1;

    useEffect(() => {
      if (
        !flexDirection?.includes("column") &&
        calculatedWidth &&
        numColumns > 0 &&
        responsiveColSpan > 0
      ) {
        // find out in which row of itemsPerRow the current item's index is
        const row = Object.keys(itemsPerRow).find((key) => {
          return itemsPerRow[Number(key)]?.includes(props?.index ?? -1);
        });

        const rowColsCount = itemsPerRow[Number(row ?? -1)]?.length ?? 0;

        const space = columnGap || gap || 0;

        const gutterOffset =
          space *
          (rowColsCount === 1 && responsiveColSpan < numColumns
            ? 2
            : rowColsCount - 1);

        const flexBasisVal =
          Math.min(
            (((calculatedWidth - gutterOffset) * responsiveColSpan) /
              numColumns /
              calculatedWidth) *
              100,
            100
          ) + "%";

        setFlexBasisValue(flexBasisVal);
      }
    }, [
      calculatedWidth,
      responsiveColSpan,
      numColumns,
      columnGap,
      gap,
      flexDirection,
      itemsPerRow,
      props?.index
    ]);

    return (
      <View
        ref={ref}
        {...{ gridItemClass }}
        className={gridItemStyle({
          class: className,
        })}
        {...props}
        style={[
          {
            // Using a safe type assertion for flexBasis
            flexBasis: typeof flexBasisValue === 'string' ? flexBasisValue.toString() : flexBasisValue,
          } as any,
          props.style,
        ]}
      />
    );
  }
);

Grid.displayName = "Grid";
GridItem.displayName = "GridItem";

export { Grid, GridItem };
