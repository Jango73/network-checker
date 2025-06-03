import { useI18n } from '@renderer/hooks/useI18n';
import styles from './ConnectionDetails.module.css';

// Props for both ScanResult and HistoryEntry (compatible fields)
interface ConnectionDetailsProps {
    ip: string;
    country: string | null;
    city: string | null;
    provider: string | null;
    organization: string | null;
    lat: number | null;
    lon: number | null;
    pid: number;
    process: string | null;
    processPath: string | null;
    isSigned: boolean;
    isRisky: boolean;
    suspicionReason: string | null;
}

export default function ConnectionDetails({
    ip,
    country,
    city,
    provider,
    organization,
    lat,
    lon,
    pid,
    process,
    processPath,
    isSigned,
    isRisky,
    suspicionReason,
}: ConnectionDetailsProps) {
    const { t } = useI18n();

    return (
        <div className={styles.details}>
            <p>
                <strong>{t('ip')}:</strong> {ip}
            </p>
            <p>
                <strong>{t('country')}:</strong> {country || '-'}
            </p>
            <p>
                <strong>{t('city')}:</strong> {city || '-'}
            </p>
            <p>
                <strong>{t('provider')}:</strong> {provider || '-'}
            </p>
            <p>
                <strong>{t('organization')}:</strong> {organization || '-'}
            </p>
            <p>
                <strong>{t('coordinates')}:</strong> Lat: {lat || '-'}, Lon:{' '}
                {lon || '-'}
            </p>
            <p>
                <strong>{t('pid')}:</strong> {pid}
            </p>
            <p>
                <strong>{t('process')}:</strong> {process || '-'}
            </p>
            <p>
                <strong>{t('processPath')}:</strong> {processPath || '-'}
            </p>
            <p>
                <strong>{t('isSigned')}:</strong>{' '}
                {isSigned ? t('yes') : t('no')}
            </p>
            {isRisky && (
                <p>
                    <strong>{t('reason')}:</strong> {suspicionReason || '-'}
                </p>
            )}
        </div>
    );
}
