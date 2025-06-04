import { useI18n } from '@renderer/hooks/useI18n';
import styles from './AboutPage.module.css';

export default function AboutPage() {
    const { t } = useI18n();

    return (
        <div className={styles.container}>
            <h1>{t('about')}</h1>
            <div className="card">
                <h2>{t('appInfo')}</h2>
                <p>
                    Master (directives and assembly):&nbsp;
                    <a
                        href="https://github.com/Jango73"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Jango73
                    </a>
                    <br />
                    Slave (coding): Grok (mostly) & ChatGPT
                    <br />
                </p>
                <p>
                    This application is licensed under the&nbsp;
                    <a
                        href="https://www.gnu.org/licenses/gpl-3.0.html"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        GNU General Public License v3.0 (GPLv3).
                    </a>
                    .
                </p>
                <p>
                    Map (unmodified): "Mercator Projection" by Daniel R. Strebe,
                    licensed under Creative Commons Attribution-ShareAlike 3.0
                    Unported (CC BY-SA 3.0).&nbsp;
                    <a
                        href="https://commons.wikimedia.org/wiki/File:Mercator_projection_Square.JPG"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Source: Wikimedia Commons
                    </a>
                    .
                </p>
            </div>
            <div className="card">
                <h2>{t('description')}</h2>
                <p>{t('aboutDescription')}</p>
            </div>
        </div>
    );
}
