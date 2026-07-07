"""
Structured Voice DNA schema.

What changes and why:

- BrandProfile gains structured positioning (category, key_benefit,
  differentiators, reasons_to_believe, competitors, known_for, mission,
  values, tagline), archetypes, five Aaker personality sliders,
  distinctive_assets, maturity_stage, primary_language, and industry —
  replacing the template-in-a-TextField positioning_notes approach with
  queryable fields.
- New models: AudienceSegment (structured segments replacing the free-text
  audience field), BrandVoice (versioned Voice DNA with the four NN/g tone
  sliders, behavioral rules, and a single-active-per-profile constraint),
  VoiceExample (annotated do/don't few-shot rows), ChannelStyle (per-channel
  tone deltas and norms, unique per profile+channel), and VoiceAuditScore
  (persisted voice-review results linked to llm.AIRun).
- BrandAsset gains source_url, channel, language, performance_signal, and
  content_date so extraction can weight evidence; 'crawled' source type and
  'excluded' status are added.
- The old flat fields (audience, tone, preferred_vocabulary, banned_phrases,
  positioning_notes) stay through a deprecation window with deprecated
  help_text; 0005 migrates their data into BrandVoice/AudienceSegment rows.
"""

import django.core.validators
import django.db.models.deletion
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('brand', '0003_brandasset_media_fields'),
        ('llm', '0002_airun_brand_asset_analysis_choice'),
    ]

    operations = [
        migrations.AddField(
            model_name='brandasset',
            name='channel',
            field=models.CharField(blank=True, choices=[('linkedin', 'LinkedIn'), ('instagram', 'Instagram'), ('blog', 'Blog'), ('newsletter', 'Newsletter'), ('x', 'X'), ('short_video', 'Short video')], default='', max_length=20),
        ),
        migrations.AddField(
            model_name='brandasset',
            name='content_date',
            field=models.DateField(blank=True, help_text='When the content was originally published; stale content is down-weighted.', null=True),
        ),
        migrations.AddField(
            model_name='brandasset',
            name='language',
            field=models.CharField(blank=True, default='', max_length=12),
        ),
        migrations.AddField(
            model_name='brandasset',
            name='performance_signal',
            field=models.CharField(choices=[('unknown', 'Unknown'), ('top', 'Top performer'), ('average', 'Average'), ('poor', 'Underperformed')], default='unknown', help_text='User-declared: did this content perform well? Weights extraction.', max_length=10),
        ),
        migrations.AddField(
            model_name='brandasset',
            name='source_url',
            field=models.URLField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='brandprofile',
            name='archetype',
            field=models.CharField(blank=True, choices=[('innocent', 'Innocent'), ('sage', 'Sage'), ('explorer', 'Explorer'), ('outlaw', 'Outlaw'), ('magician', 'Magician'), ('hero', 'Hero'), ('lover', 'Lover'), ('jester', 'Jester'), ('everyperson', 'Everyperson'), ('caregiver', 'Caregiver'), ('ruler', 'Ruler'), ('creator', 'Creator')], default='', max_length=20),
        ),
        migrations.AddField(
            model_name='brandprofile',
            name='category',
            field=models.CharField(blank=True, default='', help_text="The market frame of reference, e.g. 'bookkeeping app for freelancers'.", max_length=200),
        ),
        migrations.AddField(
            model_name='brandprofile',
            name='competitors',
            field=models.JSONField(default=list, help_text="List of {'name': str, 'url': str, 'notes': str} for positioning audits."),
        ),
        migrations.AddField(
            model_name='brandprofile',
            name='differentiators',
            field=models.JSONField(default=list, help_text="List of {'claim': str, 'vs': str} — what is different and versus whom/what."),
        ),
        migrations.AddField(
            model_name='brandprofile',
            name='distinctive_assets',
            field=models.JSONField(default=dict, help_text="Recognition assets: {'colors': [...], 'fonts': [...], 'taglines': [...], 'recurring_motifs': [...], 'emoji_signature': [...]}"),
        ),
        migrations.AddField(
            model_name='brandprofile',
            name='industry',
            field=models.CharField(blank=True, default='', max_length=120),
        ),
        migrations.AddField(
            model_name='brandprofile',
            name='key_benefit',
            field=models.TextField(blank=True, default='', help_text='The single most important benefit the brand promises.'),
        ),
        migrations.AddField(
            model_name='brandprofile',
            name='known_for',
            field=models.TextField(blank=True, default='', help_text='What the brand wants to be known for, in one or two sentences.'),
        ),
        migrations.AddField(
            model_name='brandprofile',
            name='maturity_stage',
            field=models.CharField(choices=[('idea', 'Idea / pre-launch'), ('new', 'Newly launched'), ('growing', 'Growing'), ('established', 'Established')], default='new', max_length=20),
        ),
        migrations.AddField(
            model_name='brandprofile',
            name='mission',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='brandprofile',
            name='personality_competence',
            field=models.PositiveSmallIntegerField(default=50, help_text='Reliable, intelligent, successful.', validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(100)]),
        ),
        migrations.AddField(
            model_name='brandprofile',
            name='personality_excitement',
            field=models.PositiveSmallIntegerField(default=50, help_text='Daring, spirited, imaginative.', validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(100)]),
        ),
        migrations.AddField(
            model_name='brandprofile',
            name='personality_ruggedness',
            field=models.PositiveSmallIntegerField(default=50, help_text='Outdoorsy, tough.', validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(100)]),
        ),
        migrations.AddField(
            model_name='brandprofile',
            name='personality_sincerity',
            field=models.PositiveSmallIntegerField(default=50, help_text='Down-to-earth, honest, wholesome.', validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(100)]),
        ),
        migrations.AddField(
            model_name='brandprofile',
            name='personality_sophistication',
            field=models.PositiveSmallIntegerField(default=50, help_text='Upper-class, charming, refined.', validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(100)]),
        ),
        migrations.AddField(
            model_name='brandprofile',
            name='primary_language',
            field=models.CharField(default='en', max_length=12),
        ),
        migrations.AddField(
            model_name='brandprofile',
            name='reasons_to_believe',
            field=models.JSONField(default=list, help_text='List of proof points supporting the key benefit.'),
        ),
        migrations.AddField(
            model_name='brandprofile',
            name='secondary_archetype',
            field=models.CharField(blank=True, choices=[('innocent', 'Innocent'), ('sage', 'Sage'), ('explorer', 'Explorer'), ('outlaw', 'Outlaw'), ('magician', 'Magician'), ('hero', 'Hero'), ('lover', 'Lover'), ('jester', 'Jester'), ('everyperson', 'Everyperson'), ('caregiver', 'Caregiver'), ('ruler', 'Ruler'), ('creator', 'Creator')], default='', max_length=20),
        ),
        migrations.AddField(
            model_name='brandprofile',
            name='tagline',
            field=models.CharField(blank=True, default='', max_length=200),
        ),
        migrations.AddField(
            model_name='brandprofile',
            name='values',
            field=models.JSONField(default=list, help_text='List of 3-5 core value strings.'),
        ),
        migrations.AlterField(
            model_name='brandasset',
            name='source_type',
            field=models.CharField(choices=[('pasted', 'Pasted sample'), ('uploaded', 'Uploaded file'), ('crawled', 'Crawled from URL')], default='pasted', max_length=20),
        ),
        migrations.AlterField(
            model_name='brandasset',
            name='status',
            field=models.CharField(choices=[('ready', 'Ready'), ('needs_review', 'Needs review'), ('excluded', 'Excluded from extraction')], default='needs_review', max_length=20),
        ),
        migrations.AlterField(
            model_name='brandprofile',
            name='audience',
            field=models.TextField(blank=True, default='', help_text='Deprecated: replaced by AudienceSegment rows.'),
        ),
        migrations.AlterField(
            model_name='brandprofile',
            name='banned_phrases',
            field=models.JSONField(default=list, help_text='Deprecated: replaced by BrandVoice.banned_phrases.'),
        ),
        migrations.AlterField(
            model_name='brandprofile',
            name='positioning_notes',
            field=models.TextField(blank=True, default='', help_text='Deprecated: replaced by structured positioning fields and BrandVoice.'),
        ),
        migrations.AlterField(
            model_name='brandprofile',
            name='preferred_vocabulary',
            field=models.JSONField(default=list, help_text='Deprecated: replaced by BrandVoice.preferred_vocabulary.'),
        ),
        migrations.AlterField(
            model_name='brandprofile',
            name='tone',
            field=models.JSONField(default=list, help_text='Deprecated: replaced by BrandVoice tone sliders and tone_tags.'),
        ),
        migrations.CreateModel(
            name='BrandVoice',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('version', models.PositiveIntegerField(default=1)),
                ('is_active', models.BooleanField(default=False)),
                ('voice_summary', models.TextField(blank=True, default='', help_text='2-3 sentence description of the voice a new writer could act on.')),
                ('tone_funny', models.PositiveSmallIntegerField(default=50, help_text='0 = fully serious, 100 = fully funny.', validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(100)])),
                ('tone_casual', models.PositiveSmallIntegerField(default=50, help_text='0 = fully formal, 100 = fully casual.', validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(100)])),
                ('tone_irreverent', models.PositiveSmallIntegerField(default=50, help_text='0 = fully respectful, 100 = fully irreverent.', validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(100)])),
                ('tone_enthusiastic', models.PositiveSmallIntegerField(default=50, help_text='0 = matter-of-fact, 100 = enthusiastic.', validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(100)])),
                ('tone_tags', models.JSONField(default=list, help_text="Secondary human-friendly descriptors, e.g. ['warm', 'direct']. Max 4.")),
                ('point_of_view', models.CharField(blank=True, default='', help_text="Dominant POV, e.g. 'we-to-you', 'first-person-singular'.", max_length=40)),
                ('sentence_style', models.TextField(blank=True, default='', help_text="Behavioral rules: e.g. 'Short declaratives. One idea per sentence.'")),
                ('pacing', models.CharField(blank=True, default='', max_length=200)),
                ('proof_style', models.TextField(blank=True, default='', help_text='How claims are supported: specifics vs. stories vs. data; hedging policy.')),
                ('claim_boundaries', models.JSONField(default=list, help_text="List of {'rule': str, 'reason': str} claim rules.")),
                ('preferred_vocabulary', models.JSONField(default=list, help_text="List of {'term': str, 'instead_of': str|null, 'note': str}.")),
                ('banned_phrases', models.JSONField(default=list, help_text="List of {'phrase': str, 'reason': str, 'severity': 'hard'|'soft'}.")),
                ('extraction_confidence', models.PositiveSmallIntegerField(default=0, help_text='Model-reported confidence 0-100 given sample volume/quality.', validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(100)])),
                ('extraction_notes', models.TextField(blank=True, default='', help_text='Model notes: gaps in the sample set, conflicts between assets.')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('brand_profile', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='voices', to='brand.brandprofile')),
                ('extracted_from', models.ManyToManyField(blank=True, help_text='Assets this voice version was extracted from (provenance).', related_name='voice_versions', to='brand.brandasset')),
            ],
            options={
                'ordering': ('-version',),
            },
        ),
        migrations.CreateModel(
            name='ChannelStyle',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('channel', models.CharField(choices=[('linkedin', 'LinkedIn'), ('instagram', 'Instagram'), ('blog', 'Blog'), ('newsletter', 'Newsletter'), ('x', 'X'), ('short_video', 'Short video')], max_length=20)),
                ('tone_funny_delta', models.SmallIntegerField(default=0, validators=[django.core.validators.MinValueValidator(-50), django.core.validators.MaxValueValidator(50)])),
                ('tone_casual_delta', models.SmallIntegerField(default=0, validators=[django.core.validators.MinValueValidator(-50), django.core.validators.MaxValueValidator(50)])),
                ('tone_irreverent_delta', models.SmallIntegerField(default=0, validators=[django.core.validators.MinValueValidator(-50), django.core.validators.MaxValueValidator(50)])),
                ('tone_enthusiastic_delta', models.SmallIntegerField(default=0, validators=[django.core.validators.MinValueValidator(-50), django.core.validators.MaxValueValidator(50)])),
                ('target_length', models.CharField(blank=True, default='', help_text="e.g. '80-150 words', '3 short paragraphs', '<= 280 chars'.", max_length=120)),
                ('structure_norms', models.TextField(blank=True, default='', help_text="e.g. 'Hook line, 3 value points, single CTA. No headers.'")),
                ('emoji_policy', models.CharField(blank=True, default='', help_text="e.g. 'none', 'max 1, never in first line'.", max_length=200)),
                ('hashtag_policy', models.CharField(blank=True, default='', max_length=200)),
                ('cta_style', models.CharField(blank=True, default='', help_text="e.g. 'soft invitation, never urgency-driven'.", max_length=200)),
                ('notes', models.TextField(blank=True, default='')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('brand_profile', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='channel_styles', to='brand.brandprofile')),
            ],
        ),
        migrations.CreateModel(
            name='VoiceAuditScore',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('channel', models.CharField(blank=True, choices=[('linkedin', 'LinkedIn'), ('instagram', 'Instagram'), ('blog', 'Blog'), ('newsletter', 'Newsletter'), ('x', 'X'), ('short_video', 'Short video')], default='', max_length=20)),
                ('draft_excerpt', models.TextField(blank=True, default='')),
                ('overall_score', models.PositiveSmallIntegerField(default=0, validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(100)])),
                ('dimension_scores', models.JSONField(default=dict, help_text="{'tone_alignment': int, 'vocabulary': int, 'sentence_style': int, 'claims': int, 'channel_fit': int}")),
                ('violations', models.JSONField(default=list, help_text="List of {'span': str, 'issue': str, 'severity': str, 'suggested_fix': str}.")),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('ai_run', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='audit_scores', to='llm.airun')),
                ('voice', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='audit_scores', to='brand.brandvoice')),
            ],
            options={
                'ordering': ('-created_at',),
            },
        ),
        migrations.CreateModel(
            name='VoiceExample',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('kind', models.CharField(choices=[('do', 'Do (sounds like us)'), ('dont', "Don't (avoid sounding like this)")], max_length=8)),
                ('text', models.TextField()),
                ('annotation', models.TextField(help_text='Why this works / fails, as a reusable pattern.')),
                ('channel', models.CharField(blank=True, choices=[('linkedin', 'LinkedIn'), ('instagram', 'Instagram'), ('blog', 'Blog'), ('newsletter', 'Newsletter'), ('x', 'X'), ('short_video', 'Short video')], default='', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('source_asset', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='derived_examples', to='brand.brandasset')),
                ('voice', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='examples', to='brand.brandvoice')),
            ],
            options={
                'ordering': ('kind', 'created_at'),
            },
        ),
        migrations.CreateModel(
            name='AudienceSegment',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(help_text="e.g. 'Solo consultants scaling past referrals'.", max_length=120)),
                ('is_primary', models.BooleanField(default=False)),
                ('buyer_type', models.CharField(blank=True, default='', help_text="e.g. 'B2B decision maker', 'consumer'.", max_length=120)),
                ('maturity_level', models.CharField(choices=[('unaware', 'Problem-unaware'), ('problem_aware', 'Problem-aware'), ('solution_aware', 'Solution-aware'), ('product_aware', 'Product-aware'), ('expert', 'Expert / power user')], default='problem_aware', max_length=20)),
                ('pains', models.JSONField(default=list, help_text='List of pain point strings.')),
                ('desired_outcomes', models.JSONField(default=list, help_text='List of outcome strings.')),
                ('jargon_tolerance', models.PositiveSmallIntegerField(default=50, help_text='0 = plain language only, 100 = full industry jargon.', validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(100)])),
                ('objections', models.JSONField(default=list, help_text='Common objections content should pre-empt.')),
                ('notes', models.TextField(blank=True, default='')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('brand_profile', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='segments', to='brand.brandprofile')),
            ],
            options={
                'ordering': ('-is_primary', 'name'),
                'indexes': [models.Index(fields=['brand_profile', 'is_primary'], name='brand_audie_brand_p_990fae_idx')],
            },
        ),
        migrations.AddIndex(
            model_name='brandvoice',
            index=models.Index(fields=['brand_profile', 'is_active'], name='brand_brand_brand_p_77f802_idx'),
        ),
        migrations.AddConstraint(
            model_name='brandvoice',
            constraint=models.UniqueConstraint(fields=('brand_profile', 'version'), name='unique_voice_version'),
        ),
        migrations.AddConstraint(
            model_name='brandvoice',
            constraint=models.UniqueConstraint(condition=models.Q(('is_active', True)), fields=('brand_profile',), name='single_active_voice'),
        ),
        migrations.AddConstraint(
            model_name='channelstyle',
            constraint=models.UniqueConstraint(fields=('brand_profile', 'channel'), name='unique_channel_style'),
        ),
        migrations.AddIndex(
            model_name='voiceauditscore',
            index=models.Index(fields=['voice', 'created_at'], name='brand_voice_voice_i_ad3132_idx'),
        ),
        migrations.AddIndex(
            model_name='voiceexample',
            index=models.Index(fields=['voice', 'kind', 'channel'], name='brand_voice_voice_i_440e40_idx'),
        ),
    ]
