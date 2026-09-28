import styles from "./ProgressBar.module.css";
export function ProgressBar({value,variant="default",size="md",label="Maqsadga erishish"}:{value:number;variant?:"default"|"success"|"danger";size?:"sm"|"md";label?:string}) {
 const clamped=Number.isFinite(value)?Math.max(0,Math.min(100,value)):0;
 return <div className={`${styles.track} ${styles[size]} ${styles[variant]}`} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={clamped}><span className={styles.fill} style={{width:`${clamped}%`}} /></div>;
}
